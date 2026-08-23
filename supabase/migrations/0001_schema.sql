-- ============================================================================
-- TechnIQ — Migration 0001: Core Schema
-- Enums, tables, constraints, indexes.
-- Run this in the Supabase SQL editor (or via `supabase db push`) first.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

create type request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

create type notification_type as enum (
  'request_received',
  'request_accepted',
  'request_rejected',
  'new_message'
);

-- ----------------------------------------------------------------------------
-- COLLEGES
-- Seeded/admin-curated. email_domain drives automatic college detection at
-- onboarding (see architecture doc §8). Domains are lowercase, no leading '@'.
-- ----------------------------------------------------------------------------

create table colleges (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email_domain text unique,        -- e.g. 'vit.ac.in'; nullable for colleges added without a known domain
  logo_url     text,
  created_at   timestamptz not null default now()
);

comment on table colleges is 'Curated list of colleges. email_domain enables automatic detection at onboarding; falls back to manual dropdown selection if no domain match.';

-- ----------------------------------------------------------------------------
-- PROFILES
-- 1:1 with auth.users. id is shared with auth.users.id so RLS can key off
-- auth.uid() directly without a join.
-- ----------------------------------------------------------------------------

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  name            text not null,
  avatar_url      text,
  college_id      uuid references colleges(id),
  department      text,
  year            smallint check (year is null or year between 1 and 6),
  bio             text,
  can_teach       boolean not null default false,
  students_helped integer not null default 0,
  is_demo         boolean not null default false, -- distinguishes seed/demo accounts from real users
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column profiles.students_helped is 'Denormalized counter, maintained only by the accept-request trigger. Never write to this directly from the client.';
comment on column profiles.is_demo is 'True for seeded demonstration accounts. Used to visually badge demo users and to keep them out of certain flows if desired.';

create index idx_profiles_college_id on profiles (college_id);
create index idx_profiles_can_teach on profiles (can_teach);
create index idx_profiles_college_can_teach on profiles (college_id, can_teach);

-- ----------------------------------------------------------------------------
-- SKILLS
-- ----------------------------------------------------------------------------

create table skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  category   text not null,
  created_at timestamptz not null default now()
);

create index idx_skills_category on skills (category);
-- trigram index for fast partial/fuzzy search; enable extension first
create extension if not exists pg_trgm;
create index idx_skills_name_trgm on skills using gin (name gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- USER_SKILLS (many-to-many join)
-- ----------------------------------------------------------------------------

create table user_skills (
  user_id    uuid not null references profiles(id) on delete cascade,
  skill_id   uuid not null references skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create index idx_user_skills_skill_id on user_skills (skill_id);

-- ----------------------------------------------------------------------------
-- LEARNING_REQUESTS
-- ----------------------------------------------------------------------------

create table learning_requests (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  skill_id    uuid not null references skills(id),
  message     text,
  status      request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint chk_no_self_request check (sender_id <> receiver_id)
);

create index idx_requests_sender on learning_requests (sender_id);
create index idx_requests_receiver on learning_requests (receiver_id);
create index idx_requests_status on learning_requests (status);
create index idx_requests_created_at on learning_requests (created_at desc);

-- Prevent duplicate *pending* requests for the same sender→receiver→skill triple.
-- (A rejected/cancelled request doesn't block a future retry.)
create unique index uq_requests_pending_triple
  on learning_requests (sender_id, receiver_id, skill_id)
  where (status = 'pending');

-- ----------------------------------------------------------------------------
-- CONVERSATIONS / CONVERSATION_MEMBERS / MESSAGES
-- ----------------------------------------------------------------------------

create table conversations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index idx_conv_members_user on conversation_members (user_id);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  content         text not null check (char_length(trim(content)) > 0),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_messages_conversation_created on messages (conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- reference_id is intentionally not a foreign key: it points to different
-- tables depending on `type` (a request row, a message row, etc.), so a
-- single FK constraint isn't possible. Integrity for it is enforced in the
-- trigger functions that create notifications, not at the schema level.
-- ----------------------------------------------------------------------------

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  type          notification_type not null,
  reference_id  uuid,
  message       text not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id);
create index idx_notifications_user_unread on notifications (user_id) where (is_read = false);
