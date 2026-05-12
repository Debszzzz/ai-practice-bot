-- AI Practice Bot database schema.
-- Run this before supabase/rls-policies.sql.

create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  difficulty text not null,
  total_score integer not null default 0,
  accuracy integer not null default 0,
  followups integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  question text not null,
  answer text,
  score integer not null default 0,
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_created_at_idx
on public.sessions (user_id, created_at desc);

create index if not exists questions_session_id_idx
on public.questions (session_id);
