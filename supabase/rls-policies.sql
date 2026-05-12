-- Run this in the Supabase SQL editor after creating the tables.
-- It restricts each user to only their own sessions and related questions.

alter table public.sessions enable row level security;
alter table public.questions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.sessions to authenticated;
grant select, insert, update, delete on table public.questions to authenticated;

drop policy if exists "Users can read own sessions" on public.sessions;
create policy "Users can read own sessions"
on public.sessions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions"
on public.sessions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions"
on public.sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.sessions;
create policy "Users can delete own sessions"
on public.sessions for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read questions for own sessions" on public.questions;
create policy "Users can read questions for own sessions"
on public.questions for select
using (
  exists (
    select 1 from public.sessions
    where sessions.id = questions.session_id
    and sessions.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert questions for own sessions" on public.questions;
create policy "Users can insert questions for own sessions"
on public.questions for insert
with check (
  exists (
    select 1 from public.sessions
    where sessions.id = questions.session_id
    and sessions.user_id = auth.uid()
  )
);

drop policy if exists "Users can update questions for own sessions" on public.questions;
create policy "Users can update questions for own sessions"
on public.questions for update
using (
  exists (
    select 1 from public.sessions
    where sessions.id = questions.session_id
    and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sessions
    where sessions.id = questions.session_id
    and sessions.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete questions for own sessions" on public.questions;
create policy "Users can delete questions for own sessions"
on public.questions for delete
using (
  exists (
    select 1 from public.sessions
    where sessions.id = questions.session_id
    and sessions.user_id = auth.uid()
  )
);
