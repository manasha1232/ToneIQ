-- ToneIQ Supabase Schema
-- Run via: supabase db push  OR  psql $DATABASE_URL < schema.sql

create extension if not exists "uuid-ossp";

create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  email       text unique not null,
  created_at  timestamptz default now()
);

create table if not exists sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references users(id) on delete cascade,
  scenario_id  text not null,
  status       text not null default 'active',  -- active | complete | deleted
  started_at   timestamptz default now(),
  completed_at timestamptz
);

create table if not exists turns (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid references sessions(id) on delete cascade,
  turn_index      int not null,
  user_transcript text,
  ai_response     text,
  tone_score      numeric(5,2),
  blame_flag      boolean default false,
  clarity_score   int check (clarity_score between 1 and 5),
  feedback_issue  text,
  feedback_impact text,
  feedback_better text,
  created_at      timestamptz default now()
);

create table if not exists progress (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references users(id) on delete cascade,
  date       date not null,
  avg_score  numeric(5,2),
  sessions   int default 0,
  unique(user_id, date)
);

-- TTL job helper: mark audio as purged (audio never stored in DB; this logs the event)
create table if not exists audio_purge_log (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid references sessions(id) on delete cascade,
  purged_at   timestamptz default now()
);

-- Row-level security (enable in Supabase dashboard)
alter table users    enable row level security;
alter table sessions enable row level security;
alter table turns    enable row level security;
alter table progress enable row level security;
