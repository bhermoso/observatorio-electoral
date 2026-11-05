-- Esquema de resultados de descubrimiento; no almacena entrevistas ni ficheros privados.
-- Migración aplicada al proyecto gjzihgfzxorpvevrrfkh el 5 de noviembre de 2026.
create table if not exists public.microdata_scan_cache (
 id integer primary key default 1 check (id = 1),
 checked_at timestamptz,
 last_attempt_at timestamptz,
 locked_until timestamptz not null default '-infinity'::timestamptz,
 candidates jsonb not null default '[]'::jsonb,
 errors jsonb not null default '[]'::jsonb,
 summary jsonb not null default '{}'::jsonb
);
alter table public.microdata_scan_cache enable row level security;
revoke all on table public.microdata_scan_cache from PUBLIC, anon, authenticated;
grant select, insert, update on public.microdata_scan_cache to service_role;
insert into public.microdata_scan_cache(id) values (1) on conflict (id) do nothing;
create or replace function public.claim_microdata_scan() returns boolean
language sql set search_path = ''
as $$
 with claimed as (
  update public.microdata_scan_cache
     set locked_until = now() + interval '5 minutes'
   where id = 1 and locked_until < now()
   returning id
 ) select exists(select 1 from claimed);
$$;
revoke all on function public.claim_microdata_scan() from PUBLIC, anon, authenticated;
grant execute on function public.claim_microdata_scan() to service_role;