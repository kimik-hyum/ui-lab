alter table public.products
  add column if not exists image_width integer not null default 1200,
  add column if not exists image_height integer not null default 900;
