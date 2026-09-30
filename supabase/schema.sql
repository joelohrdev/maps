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

-- Paint palettes: one row per user holding their whole palette.
-- `paints` is a JSON array of { id, name, hex, pigment? }; `medium` is 'watercolor' or 'opaque'.
create table if not exists public.palettes (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  medium text not null default 'watercolor' check (medium in ('watercolor', 'opaque')),
  paints jsonb not null default '[]'::jsonb check (jsonb_typeof(paints) = 'array'),
  updated_at timestamptz not null default now()
);

alter table public.palettes enable row level security;

drop policy if exists "Users manage their own palette" on public.palettes;
create policy "Users manage their own palette" on public.palettes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
