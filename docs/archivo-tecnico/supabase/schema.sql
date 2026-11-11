-- Only the Edge Function service role can access these tables.
create table public.poll_update_cache (
 id integer primary key check (id=1),
 checked_at timestamptz,
 locked_until timestamptz not null default '-infinity',
 candidates jsonb not null default '[]',
 errors jsonb not null default '[]'
);
insert into public.poll_update_cache(id) values(1);
create table public.poll_editor_config (
 id integer primary key check(id=1), key_hash text not null
);
create table public.poll_submissions (
 id text primary key, fingerprint text unique not null,
 record jsonb not null, created_at timestamptz not null default now()
);
alter table public.poll_update_cache enable row level security;
alter table public.poll_editor_config enable row level security;
alter table public.poll_submissions enable row level security;
revoke all on public.poll_update_cache, public.poll_editor_config, public.poll_submissions from anon, authenticated;
grant all on public.poll_update_cache, public.poll_editor_config, public.poll_submissions to service_role;
create function public.claim_poll_scan() returns boolean
language sql security invoker set search_path = '' as $$
 with claimed as (
  update public.poll_update_cache set locked_until=now()+interval '5 minutes'
  where id=1 and locked_until<now() returning id
 ) select exists(select 1 from claimed);
$$;
revoke all on function public.claim_poll_scan() from public, anon, authenticated;
grant execute on function public.claim_poll_scan() to service_role;
