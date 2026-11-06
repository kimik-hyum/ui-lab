-- Survey identities remain stable; display order and labels are independent.
create schema if not exists survey_private;
revoke all on schema survey_private from public, anon, authenticated;

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  survey_key text not null unique check (survey_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  selection_type text not null check (selection_type in ('radio', 'checkbox')),
  min_selections integer not null default 1,
  max_selections integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now(),
  constraint surveys_selection_bounds check (1 <= min_selections and min_selections <= max_selections),
  constraint surveys_radio_bounds check (selection_type <> 'radio' or (min_selections = 1 and max_selections = 1))
);

create table public.survey_options (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete restrict,
  option_key text not null check (option_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  sort_order integer not null check (sort_order >= 0),
  is_active boolean not null default true,
  constraint survey_options_key unique (survey_id, option_key),
  constraint survey_options_identity unique (id, survey_id)
);
create index survey_options_display_idx on public.survey_options(survey_id, sort_order);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 300),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survey_responses_user unique (survey_id, user_id),
  constraint survey_responses_identity unique (id, survey_id)
);
create index survey_responses_user_idx on public.survey_responses(user_id);

create table public.response_options (
  response_id uuid not null,
  option_id uuid not null,
  survey_id uuid not null,
  primary key (response_id, option_id),
  constraint response_options_response foreign key (response_id, survey_id)
    references public.survey_responses(id, survey_id) on delete cascade,
  constraint response_options_option foreign key (option_id, survey_id)
    references public.survey_options(id, survey_id) on delete restrict
);
create index response_options_option_idx on public.response_options(option_id, survey_id);

comment on table public.survey_responses is 'One current response per user and survey. Account deletion also deletes responses.';
comment on column public.survey_responses.reason is 'Optional reason for the whole selection, at most 300 characters.';
comment on column public.response_options.survey_id is 'Composite foreign keys prevent selecting an option from a different survey.';

create function survey_private.guard_survey_definition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception using errcode = '23514', message = 'survey_delete_published';
    end if;
    return old;
  end if;
  if new.id is distinct from old.id or new.survey_key is distinct from old.survey_key then
    raise exception using errcode = '23514', message = 'survey_identity_immutable';
  end if;
  if old.status <> 'draft' and (
    new.status = 'draft' or
    (new.selection_type, new.min_selections, new.max_selections) is distinct from
    (old.selection_type, old.min_selections, old.max_selections)
  ) then
    raise exception using errcode = '23514', message = 'survey_rules_immutable_after_publication';
  end if;
  return new;
end;
$$;
create trigger guard_survey_definition before update or delete on public.surveys
for each row execute function survey_private.guard_survey_definition();

create function survey_private.guard_survey_option()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_survey_id uuid;
  v_status text;
begin
  if tg_op = 'UPDATE' and (
    (new.id, new.survey_id, new.option_key) is distinct from (old.id, old.survey_id, old.option_key)
  ) then
    raise exception using errcode = '23514', message = 'survey_option_identity_immutable';
  end if;
  v_survey_id := case when tg_op = 'DELETE' then old.survey_id else new.survey_id end;
  -- Serialize definition edits with publication and submissions.
  select status into v_status from public.surveys where id = v_survey_id for update;
  if tg_op in ('INSERT', 'DELETE') and v_status <> 'draft' then
    raise exception using errcode = '23514', message = 'survey_options_immutable_after_publication';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger guard_survey_option before insert or update or delete on public.survey_options
for each row execute function survey_private.guard_survey_option();

create function survey_private.check_survey_available_options()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_survey_id uuid;
  v_survey public.surveys%rowtype;
  v_active_count integer;
begin
  if tg_table_name = 'surveys' then
    v_survey_id := new.id;
  else
    v_survey_id := case when tg_op = 'DELETE' then old.survey_id else new.survey_id end;
  end if;
  select * into v_survey from public.surveys where id = v_survey_id;
  if not found or v_survey.status <> 'open' then return null; end if;
  select count(*) into v_active_count from public.survey_options
    where survey_id = v_survey_id and is_active;
  if v_active_count < greatest(2, v_survey.max_selections) then
    raise exception using errcode = '23514', message = 'survey_not_enough_active_options';
  end if;
  return null;
end;
$$;
-- Check the final transaction state so multiple option edits can be applied together.
create constraint trigger check_survey_available_options after insert or update on public.surveys
deferrable initially deferred for each row execute function survey_private.check_survey_available_options();
create constraint trigger check_option_availability after insert or update or delete on public.survey_options
deferrable initially deferred for each row execute function survey_private.check_survey_available_options();

create function survey_private.guard_survey_response_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.id, new.survey_id, new.user_id, new.submitted_at) is distinct from
     (old.id, old.survey_id, old.user_id, old.submitted_at) then
    raise exception using errcode = '23514', message = 'survey_response_identity_immutable';
  end if;
  return new;
end;
$$;
create trigger guard_survey_response_identity before update on public.survey_responses
for each row execute function survey_private.guard_survey_response_identity();

alter table public.surveys enable row level security;
alter table public.survey_options enable row level security;
alter table public.survey_responses enable row level security;
alter table public.response_options enable row level security;

revoke all on public.surveys, public.survey_options, public.survey_responses, public.response_options
  from public, anon, authenticated;
grant select on public.surveys, public.survey_options to anon, authenticated;
grant select on public.survey_responses, public.response_options to authenticated;
grant all on public.surveys, public.survey_options, public.survey_responses, public.response_options to service_role;

create policy surveys_read_published on public.surveys for select to anon, authenticated
  using (status in ('open', 'closed'));
create policy survey_options_read_published on public.survey_options for select to anon, authenticated
  using (exists (select 1 from public.surveys s where s.id = survey_id and s.status in ('open', 'closed')));
create policy survey_responses_read_own on public.survey_responses for select to authenticated
  using (user_id = (select auth.uid()));
create policy response_options_read_own on public.response_options for select to authenticated
  using (exists (select 1 from public.survey_responses r where r.id = response_id and r.user_id = (select auth.uid())));

create function public.submit_survey_response(p_survey_key text, p_option_keys text[], p_reason text default '')
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_survey public.surveys%rowtype;
  v_option_ids uuid[];
  v_count integer;
  v_response_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'survey_login_required';
  end if;
  select * into v_survey from public.surveys where survey_key = p_survey_key for share;
  if not found or v_survey.status <> 'open' then
    raise exception using errcode = '22023', message = 'survey_not_open';
  end if;
  v_count := cardinality(p_option_keys);
  if v_count is null or v_count < v_survey.min_selections or v_count > v_survey.max_selections then
    raise exception using errcode = '22023', message = 'survey_selection_count_invalid';
  end if;
  if array_ndims(p_option_keys) <> 1 or
     exists (select 1 from unnest(p_option_keys) k where k is null or btrim(k) = '') or
     (select count(distinct k) from unnest(p_option_keys) k) <> v_count then
    raise exception using errcode = '22023', message = 'survey_selection_invalid';
  end if;
  if char_length(coalesce(p_reason, '')) > 300 then
    raise exception using errcode = '22023', message = 'survey_reason_too_long';
  end if;
  select array_agg(o.id order by o.id) into v_option_ids from (
    select id from public.survey_options
    where survey_id = v_survey.id and option_key = any(p_option_keys) and is_active
    for share
  ) o;
  if coalesce(cardinality(v_option_ids), 0) <> v_count then
    raise exception using errcode = '22023', message = 'survey_option_unavailable';
  end if;

  -- ON CONFLICT locks the user's response until the entire selection is replaced.
  -- Concurrent submissions cannot combine selections or create duplicate responses.
  insert into public.survey_responses(survey_id, user_id, reason)
    values (v_survey.id, v_user_id, btrim(coalesce(p_reason, '')))
  on conflict (survey_id, user_id) do update
    set reason = excluded.reason, updated_at = clock_timestamp()
  returning id into v_response_id;
  delete from public.response_options where response_id = v_response_id;
  insert into public.response_options(response_id, option_id, survey_id)
    select v_response_id, id, v_survey.id from unnest(v_option_ids) id;
  return v_response_id;
end;
$$;

revoke all on all functions in schema survey_private from public, anon, authenticated;
revoke all on function public.submit_survey_response(text, text[], text) from public, anon, authenticated;
grant execute on function public.submit_survey_response(text, text[], text) to authenticated;
comment on function public.submit_survey_response(text, text[], text) is
  'Authenticated submission only. Validates the current rules and atomically replaces the user response. Never accepts a caller-provided user ID.';
