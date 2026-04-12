create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null,
  price integer not null check (price >= 0),
  currency text not null default 'KRW',
  description text not null,
  image_url text not null,
  stock integer not null default 0 check (stock >= 0),
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
      and policyname = 'public_can_read_products'
  ) then
    create policy public_can_read_products
      on public.products
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

insert into public.products (slug, name, brand, price, currency, description, image_url, stock, rating)
values
  (
    'wireless-headphones-x1',
    'Wireless Headphones X1',
    'UI Audio',
    129000,
    'KRW',
    '노이즈 캔슬링과 30시간 배터리를 제공하는 무선 헤드폰입니다.',
    'https://picsum.photos/id/180/1200/900',
    42,
    4.6
  ),
  (
    'urban-backpack-pro',
    'Urban Backpack Pro',
    'VOID Gear',
    89000,
    'KRW',
    '15인치 노트북 수납과 생활 방수를 지원하는 데일리 백팩입니다.',
    'https://picsum.photos/id/1062/1200/900',
    77,
    4.4
  ),
  (
    'ceramic-mug-set',
    'Ceramic Mug Set',
    'Lab Living',
    39000,
    'KRW',
    '심플한 디자인의 2인용 세라믹 머그 세트입니다.',
    'https://picsum.photos/id/431/1200/900',
    130,
    4.2
  )
on conflict (slug) do update
set
  name = excluded.name,
  brand = excluded.brand,
  price = excluded.price,
  currency = excluded.currency,
  description = excluded.description,
  image_url = excluded.image_url,
  stock = excluded.stock,
  rating = excluded.rating;
