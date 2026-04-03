-- ─────────────────────────────────────────────────────────────
-- AI Study Planner — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  email         text unique not null,
  full_name     text,
  avatar_url    text,
  streak        int default 0,
  total_points  int default 0,
  level         int default 1,
  last_study_date date,
  created_at    timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── subjects ──────────────────────────────────────────────────
create table public.subjects (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  description text,
  color       text default '#3b82f6',
  icon        text default '📚',
  created_at  timestamptz default now()
);
alter table public.subjects enable row level security;
create policy "Users manage own subjects" on public.subjects for all using (auth.uid() = user_id);

-- ── chapters ──────────────────────────────────────────────────
create table public.chapters (
  id           uuid default uuid_generate_v4() primary key,
  subject_id   uuid references public.subjects(id) on delete cascade not null,
  name         text not null,
  order_index  int default 0,
  is_completed boolean default false,
  created_at   timestamptz default now()
);
alter table public.chapters enable row level security;
create policy "Users manage chapters of own subjects"
  on public.chapters for all
  using (exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = auth.uid()));

-- ── topics ────────────────────────────────────────────────────
create table public.topics (
  id           uuid default uuid_generate_v4() primary key,
  chapter_id   uuid references public.chapters(id) on delete cascade not null,
  name         text not null,
  is_completed boolean default false,
  order_index  int default 0
);
alter table public.topics enable row level security;
create policy "Users manage topics via chapters"
  on public.topics for all
  using (exists (
    select 1 from public.chapters c
    join public.subjects s on s.id = c.subject_id
    where c.id = chapter_id and s.user_id = auth.uid()
  ));

-- ── notes ─────────────────────────────────────────────────────
create table public.notes (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  subject_id  uuid references public.subjects(id) on delete cascade not null,
  chapter_id  uuid references public.chapters(id) on delete set null,
  title       text not null,
  content     text not null default '',
  type        text not null default 'custom' check (type in ('short','detailed','important','exam_questions','flashcards','custom')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.notes enable row level security;
create policy "Users manage own notes" on public.notes for all using (auth.uid() = user_id);

-- ── flashcards ────────────────────────────────────────────────
create table public.flashcards (
  id          uuid default uuid_generate_v4() primary key,
  note_id     uuid references public.notes(id) on delete cascade not null,
  front       text not null,
  back        text not null,
  is_mastered boolean default false
);
alter table public.flashcards enable row level security;
create policy "Users manage flashcards via notes"
  on public.flashcards for all
  using (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));

-- ── study_sessions ────────────────────────────────────────────
create table public.study_sessions (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  subject_id       uuid references public.subjects(id) on delete set null,
  chapter_id       uuid references public.chapters(id) on delete set null,
  duration_seconds int not null default 0,
  started_at       timestamptz default now(),
  ended_at         timestamptz
);
alter table public.study_sessions enable row level security;
create policy "Users manage own sessions" on public.study_sessions for all using (auth.uid() = user_id);

-- ── study_plans ───────────────────────────────────────────────
create table public.study_plans (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  title         text not null,
  exam_date     date not null,
  hours_per_day numeric(4,1) not null,
  created_at    timestamptz default now()
);
alter table public.study_plans enable row level security;
create policy "Users manage own plans" on public.study_plans for all using (auth.uid() = user_id);

-- ── daily_plans ───────────────────────────────────────────────
create table public.daily_plans (
  id                uuid default uuid_generate_v4() primary key,
  plan_id           uuid references public.study_plans(id) on delete cascade not null,
  date              date not null,
  subject_name      text not null,
  chapter_name      text not null,
  duration_minutes  int not null,
  is_completed      boolean default false,
  notes             text
);
alter table public.daily_plans enable row level security;
create policy "Users manage daily plans via study_plans"
  on public.daily_plans for all
  using (exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid()));

-- ── achievements ──────────────────────────────────────────────
create table public.user_achievements (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at    timestamptz default now(),
  unique(user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
create policy "Users view own achievements" on public.user_achievements for all using (auth.uid() = user_id);

-- ── Storage bucket for syllabi ────────────────────────────────
insert into storage.buckets (id, name, public) values ('syllabi', 'syllabi', false) on conflict do nothing;
create policy "Users upload syllabi"
  on storage.objects for insert
  with check (bucket_id = 'syllabi' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users read own syllabi"
  on storage.objects for select
  using (bucket_id = 'syllabi' and auth.uid()::text = (storage.foldername(name))[1]);
