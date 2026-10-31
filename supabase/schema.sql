-- VibPulse schema. Run once in the Supabase SQL editor.
create type gap_type as enum ('pricing','feature','service','quality','market','adoption');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  stripe_customer_id text unique
);

create table subscriptions (
  id text primary key,                       -- Stripe subscription id
  user_id uuid not null references profiles on delete cascade,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table stripe_events (                 -- webhook idempotency
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create table gaps (
  id bigint generated always as identity primary key,
  title text not null,
  gap_type gap_type not null,
  market text not null,
  summary text not null,
  -- factor scores 0-10; weights from the VibPulse formula
  market_size numeric(4,2) not null check (market_size between 0 and 10),
  growth numeric(4,2) not null check (growth between 0 and 10),
  competition numeric(4,2) not null check (competition between 0 and 10),
  fit numeric(4,2) not null check (fit between 0 and 10),
  profit numeric(4,2) not null check (profit between 0 and 10),
  score numeric(4,2) generated always as
    (market_size*0.25 + growth*0.20 + competition*0.20 + fit*0.15 + profit*0.20) stored,
  is_sample boolean not null default false,  -- public teaser on the landing page
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table gap_sources (
  id bigint generated always as identity primary key,
  gap_id bigint not null references gaps on delete cascade,
  url text not null,
  source_name text not null,
  retrieved_at timestamptz not null default now()
);

create table priorities (                    -- War Room: today's tasks
  id bigint generated always as identity primary key,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table skill_snapshots (
  id bigint generated always as identity primary key,
  taken_at timestamptz not null default now(),
  payload jsonb not null
);

-- RLS: everything denied by default; service role (server only) bypasses it.
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table stripe_events enable row level security;
alter table gaps enable row level security;
alter table gap_sources enable row level security;
alter table priorities enable row level security;
alter table skill_snapshots enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own subscription" on subscriptions for select using (user_id = auth.uid());

create or replace function is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from subscriptions
    where user_id = auth.uid() and status in ('active','trialing'));
$$;

create policy "sample gaps are public" on gaps for select
  using (status = 'published' and is_sample);
create policy "members read published gaps" on gaps for select
  using (status = 'published' and is_member());
create policy "members read sources" on gap_sources for select
  using (exists (select 1 from gaps g where g.id = gap_id and g.status = 'published'
                 and (g.is_sample or is_member())));

-- create a profile row on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
