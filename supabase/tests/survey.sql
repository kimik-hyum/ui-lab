-- Runs in an isolated local DB; all fixtures and responses roll back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users(id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002');
insert into public.surveys(survey_key, title, selection_type) values ('test-draft', 'Draft', 'radio');

select is((select count(*) from public.survey_options), 10::bigint, 'Both UI surveys have their ten options');
select is((select count(*) from public.surveys where status = 'open'), 2::bigint, 'Both seeded surveys are open');
select ok((select bool_and(relrowsecurity) from pg_class where oid in
  ('public.surveys'::regclass, 'public.survey_options'::regclass,
   'public.survey_responses'::regclass, 'public.response_options'::regclass)), 'RLS is enabled on all four tables');

set local role anon;
select is((select count(*) from public.surveys), 2::bigint, 'Anonymous visitors cannot read draft surveys');
select is((select count(*) from public.survey_options), 10::bigint, 'Anonymous visitors can read published choices');
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll'])$$,
  '42501', null, 'Anonymous submission is forbidden');
select throws_ok($$select * from public.survey_responses$$, '42501', null, 'Anonymous users cannot read responses');
select throws_ok($$select * from public.response_options$$, '42501', null, 'Anonymous users cannot read selected choices');
select throws_ok($$update public.surveys set title = 'Changed'$$, '42501', null, 'Anonymous users cannot edit surveys');
reset role;

set local role authenticated;
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll'])$$,
  '42501', 'survey_login_required', 'An authenticated role without a user session is rejected');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll'], '  Easy to compare  ')$$,
  'Radio accepts one selection');
select is((select count(*) from public.survey_responses), 1::bigint, 'One response is stored');
select is((select count(*) from public.response_options), 1::bigint, 'One selected choice is stored');
select is((select reason from public.survey_responses), 'Easy to compare', 'Reason whitespace is trimmed');
select lives_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll'], 'Easy to compare')$$,
  'A repeated submission succeeds without a duplicate response');
select lives_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['cards'], null)$$,
  'An existing radio response can be replaced while open');
select is((select count(*) from public.survey_responses), 1::bigint, 'Replacing a response does not add a response');
select is((select option_key from public.survey_options o join public.response_options ro on ro.option_id = o.id),
  'cards', 'Replacing a response removes the old selected choice');
select is((select reason from public.survey_responses), '', 'A null reason becomes the optional empty reason');
select lives_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll','sticky'])$$,
  'Checkbox accepts its minimum of two choices');
select is((select count(*) from public.response_options), 3::bigint, 'Radio and checkbox choices are stored separately');
select lives_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['cards','sticky','stacked'], repeat('가',300))$$,
  'Checkbox accepts its maximum of three choices and a 300-character Korean reason');
select is((select count(*) from public.survey_responses), 2::bigint, 'Each survey has one response for this user');
select is((select count(*) from public.response_options), 4::bigint, 'Checkbox replacement does not accumulate old choices');

select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array[]::text[])$$,
  '22023', 'survey_selection_count_invalid', 'An empty selection is rejected');
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', null)$$,
  '22023', 'survey_selection_count_invalid', 'A null selection is rejected');
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll','cards'])$$,
  '22023', 'survey_selection_count_invalid', 'Radio rejects two choices');
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll'])$$,
  '22023', 'survey_selection_count_invalid', 'Checkbox rejects fewer than its minimum');
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll','sticky','cards','stacked'])$$,
  '22023', 'survey_selection_count_invalid', 'Checkbox rejects more than its maximum');
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll','scroll'])$$,
  '22023', 'survey_selection_invalid', 'Duplicate choices do not satisfy the minimum');
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll',null])$$,
  '22023', 'survey_selection_invalid', 'A null choice is rejected');
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll',' '])$$,
  '22023', 'survey_selection_invalid', 'An empty choice is rejected');
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array[['scroll','sticky']])$$,
  '22023', 'survey_selection_invalid', 'Nested choice arrays are rejected');
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['stacked'])$$,
  '22023', 'survey_option_unavailable', 'An option from another survey is rejected');
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['missing'])$$,
  '22023', 'survey_option_unavailable', 'An unknown choice is rejected');
select throws_ok($$select public.submit_survey_response('missing-survey', array['scroll'])$$,
  '22023', 'survey_not_open', 'An unknown survey is rejected');
select throws_ok($$select public.submit_survey_response('test-draft', array['scroll'])$$,
  '22023', 'survey_not_open', 'Draft surveys do not accept responses');
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll'], repeat('가',301))$$,
  '22023', 'survey_reason_too_long', 'A reason longer than 300 characters is rejected');
select is((select count(*) from public.response_options), 4::bigint, 'Failed submissions preserve the previous choices');
select is((select reason from public.survey_responses r join public.surveys s on s.id=r.survey_id where s.selection_type='checkbox'),
  repeat('가',300), 'Failed submissions preserve the previous reason');

select throws_ok($$insert into public.survey_responses(survey_id,user_id) select id,auth.uid() from public.surveys limit 1$$,
  '42501', null, 'Direct response inserts cannot bypass submission validation');
select throws_ok($$update public.survey_responses set reason='Bypass'$$,
  '42501', null, 'Direct response updates are forbidden');
select throws_ok($$delete from public.response_options$$,
  '42501', null, 'Direct selected-choice deletion is forbidden');
select throws_ok($$insert into public.response_options select * from public.response_options limit 1$$,
  '42501', null, 'Direct selected-choice inserts are forbidden');
select throws_ok($$update public.survey_options set is_active=false$$,
  '42501', null, 'Participants cannot change available choices');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is((select count(*) from public.survey_responses), 0::bigint, 'Another user cannot read the first user responses');
select is((select count(*) from public.response_options), 0::bigint, 'Another user cannot read the first user choices');
select lives_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['sticky'])$$,
  'A second user can submit an independent response');
select is((select count(*) from public.survey_responses), 1::bigint, 'The second user sees only their own response');
reset role;

select throws_ok($$update public.surveys set survey_key='renamed' where survey_key='responsive-tables-flat-v1'$$,
  '23514', 'survey_identity_immutable', 'Survey keys cannot be changed');
select throws_ok($$update public.surveys set id=gen_random_uuid() where survey_key='responsive-tables-flat-v1'$$,
  '23514', 'survey_identity_immutable', 'Survey UUIDs cannot be changed');
select throws_ok($$update public.survey_options set option_key='renamed' where option_key='cards'$$,
  '23514', 'survey_option_identity_immutable', 'Option keys cannot be changed');
select throws_ok($$update public.survey_options set id=gen_random_uuid() where option_key='cards'$$,
  '23514', 'survey_option_identity_immutable', 'Option UUIDs cannot be changed');
select throws_ok($$update public.surveys set selection_type='checkbox',max_selections=2 where survey_key='responsive-tables-flat-v1'$$,
  '23514', 'survey_rules_immutable_after_publication', 'Published selection rules require a new survey version');
select throws_ok($$update public.surveys set status='draft' where survey_key='responsive-tables-flat-v1'$$,
  '23514', 'survey_rules_immutable_after_publication', 'A published survey cannot be reverted to draft');
select throws_ok($$delete from public.survey_options where option_key='cards'$$,
  '23514', 'survey_options_immutable_after_publication', 'Published choices must be deactivated instead of deleted');
select throws_ok($$insert into public.survey_options(survey_id,option_key,title,sort_order) select id,'new','New',10 from public.surveys where status='open'$$,
  '23514', 'survey_options_immutable_after_publication', 'Published choice membership requires a new version');
select throws_ok($$delete from public.surveys where status='open'$$,
  '23514', 'survey_delete_published', 'Published surveys cannot be deleted');
select throws_ok($$update public.survey_responses set user_id='10000000-0000-0000-0000-000000000002' where user_id='10000000-0000-0000-0000-000000000001'$$,
  '23514', 'survey_response_identity_immutable', 'Response ownership cannot be reassigned');
select lives_ok($$update public.survey_options set sort_order=20,title=title||' 수정' where option_key='cards'$$,
  'Display order and labels can change independently of identity');
select is((select count(*) from public.response_options ro join public.survey_options o on o.id=ro.option_id where o.option_key='cards'),
  2::bigint, 'Reordering preserves the original selections');

select throws_ok($$insert into public.surveys(survey_key,title,selection_type,min_selections,max_selections) values ('invalid-radio','Invalid','radio',1,2)$$,
  '23514', null, 'Radio limits must both equal one');
select throws_ok($$insert into public.surveys(survey_key,title,selection_type,min_selections,max_selections) values ('invalid-bounds','Invalid','checkbox',3,2)$$,
  '23514', null, 'Minimum cannot exceed maximum');
select throws_ok($$insert into public.surveys(survey_key,title,selection_type,status) values ('invalid-open','Invalid','radio','open'); set constraints all immediate$$,
  '23514', 'survey_not_enough_active_options', 'A survey needs at least two active options to open');
select throws_ok($$update public.survey_options set is_active=false where survey_id=(select id from public.surveys where selection_type='checkbox'); set constraints all immediate$$,
  '23514', 'survey_not_enough_active_options', 'An open survey must retain enough active choices');
select throws_ok($$insert into public.survey_responses(survey_id,user_id) select survey_id,user_id from public.survey_responses limit 1$$,
  '23505', null, 'A user can have only one response per survey');
select throws_ok($$insert into public.response_options select * from public.response_options limit 1$$,
  '23505', null, 'The same choice cannot occur twice in a response');
select throws_ok($$insert into public.response_options(response_id,option_id,survey_id)
  select r.id,o.id,r.survey_id from public.survey_responses r
  join public.survey_options o on o.survey_id<>r.survey_id limit 1$$,
  '23503', null, 'Composite foreign keys reject cross-survey options even for admin SQL');

update public.survey_options set is_active=false where option_key='scroll'
  and survey_id=(select id from public.surveys where survey_key='responsive-tables-inner-v1');
set constraints all immediate;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['scroll','cards'])$$,
  '22023', 'survey_option_unavailable', 'A newly disabled choice is rejected at submit time');
reset role;
update public.surveys set status='closed' where survey_key='responsive-tables-inner-v1';
set local role authenticated;
select throws_ok($$select public.submit_survey_response('responsive-tables-inner-v1', array['sticky','cards'])$$,
  '22023', 'survey_not_open', 'A newly closed survey rejects updates');
select is((select count(*) from public.survey_responses), 2::bigint, 'Closing a survey preserves access to own responses');
reset role;
delete from auth.users where id='10000000-0000-0000-0000-000000000002';
select is((select count(*) from public.survey_responses), 2::bigint, 'Account deletion removes only that user responses');
select is((select count(*) from public.response_options), 4::bigint, 'Account deletion cascades to selected choices');

-- Force a failure after response upsert and choice deletion to verify rollback.
create function pg_temp.fail_survey_option_insert() returns trigger language plpgsql as $$
begin raise exception using errcode='P0001', message='test_forced_insert_failure'; end;
$$;
create trigger test_fail_survey_insert before insert on public.response_options
  for each row execute function pg_temp.fail_survey_option_insert();
set local role authenticated;
select throws_ok($$select public.submit_survey_response('responsive-tables-flat-v1', array['scroll'], 'Must roll back')$$,
  'P0001', 'test_forced_insert_failure', 'A failure during selection replacement rolls back the whole submission');
select is((select reason from public.survey_responses r join public.surveys s on s.id=r.survey_id where s.selection_type='radio'),
  '', 'The previous reason survives a partial-save failure');
select is((select o.option_key from public.response_options ro join public.survey_options o on o.id=ro.option_id
  join public.surveys s on s.id=ro.survey_id where s.selection_type='radio'),
  'cards', 'The previous selected option survives a partial-save failure');
reset role;

select * from finish();
rollback;
