-- Run once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.spots (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  primary key (user_id, id)
);

alter table public.spots enable row level security;

drop policy if exists "Users manage their own spots" on public.spots;
create policy "Users manage their own spots" on public.spots
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
