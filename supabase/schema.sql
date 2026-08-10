-- Run once in the Supabase SQL Editor before enabling cloud mode.
-- Anonymous users receive the authenticated role; RLS keeps every user's data isolated.

create table if not exists public.body_metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date not null,
  weight numeric(6, 2) not null check (weight > 0),
  body_fat numeric(5, 2) not null check (body_fat between 0 and 100),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists public.training_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) > 0),
  active boolean not null default false,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists public.workout_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date not null,
  plan_name text not null check (char_length(plan_name) > 0),
  exercises jsonb not null default '[]'::jsonb,
  calories numeric(8, 2) not null default 0 check (calories >= 0),
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists public.exercise_prs (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  exercise_name text not null check (char_length(exercise_name) > 0),
  muscle_group text,
  weight numeric(8, 2) not null check (weight > 0),
  date date not null,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists public.ai_insights (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  kind text not null check (kind in ('workout', 'pr')),
  related_id text not null,
  summary text not null,
  suggestion text,
  source text not null check (source in ('ai', 'local')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create index if not exists body_metrics_user_date_idx on public.body_metrics (user_id, date desc);
create index if not exists workout_records_user_date_idx on public.workout_records (user_id, date desc);
create index if not exists exercise_prs_user_exercise_date_idx on public.exercise_prs (user_id, exercise_name, date desc);
create index if not exists ai_insights_user_related_idx on public.ai_insights (user_id, related_id, created_at desc);
create unique index if not exists training_plans_one_active_idx on public.training_plans (user_id) where active;

alter table public.body_metrics enable row level security;
alter table public.training_plans enable row level security;
alter table public.workout_records enable row level security;
alter table public.exercise_prs enable row level security;
alter table public.ai_insights enable row level security;

create policy "Users manage own body metrics" on public.body_metrics
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own training plans" on public.training_plans
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own workout records" on public.workout_records
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own exercise PRs" on public.exercise_prs
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own AI insights" on public.ai_insights
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.body_metrics to authenticated;
grant select, insert, update, delete on public.training_plans to authenticated;
grant select, insert, update, delete on public.workout_records to authenticated;
grant select, insert, update, delete on public.exercise_prs to authenticated;
grant select, insert, update, delete on public.ai_insights to authenticated;
