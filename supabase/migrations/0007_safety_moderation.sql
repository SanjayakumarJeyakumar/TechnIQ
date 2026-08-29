-- ============================================================================
-- TechnIQ — Migration 0007: Safety, Moderation, Privacy & Complete Account Deletion
-- Idempotent, safe to run multiple times without data loss or duplicate errors.
-- 1. Profile Privacy: Lock profiles table to own-row only, expose safe public_profiles view & get_public_profile RPC
-- 2. User Blocking: user_blocks table, RLS, block_user/unblock_user/is_user_blocked/fetch_blocked_students RPCs
-- 3. Moderation Reports: user_reports table with ON DELETE SET NULL, name snapshots, RLS, report_user RPC
-- 4. Search & Block Integration: search_students RPC updated to exclude blocked users in both directions
-- 5. Request & Message Protection: RLS policies enforce block isolation
-- 6. Complete Account Deletion: delete_user_account RPC wiping user records and auth.users identity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILE PRIVACY & PUBLIC PROFILE ACCESS
-- ----------------------------------------------------------------------------

-- Safely replace direct SELECT policy on profiles
drop policy if exists "profiles_select_authenticated" on profiles;
drop policy if exists "profiles_select_own" on profiles;

create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (id = auth.uid());

-- Safe public view excluding private email and auth fields
create or replace view public_profiles as
select
  p.id,
  p.name,
  p.avatar_url,
  p.department,
  p.year,
  p.bio,
  p.students_helped,
  p.college_id,
  c.name as college_name,
  p.can_teach,
  p.created_at
from profiles p
left join colleges c on c.id = p.college_id;

grant select on public_profiles to authenticated;

create or replace function get_public_profile(p_user_id uuid)
returns table (
  id              uuid,
  name            text,
  avatar_url      text,
  department      text,
  year            smallint,
  bio             text,
  students_helped integer,
  college_id      uuid,
  college_name    text,
  can_teach       boolean,
  created_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.avatar_url,
    p.department,
    p.year,
    p.bio,
    p.students_helped,
    p.college_id,
    c.name as college_name,
    p.can_teach,
    p.created_at
  from profiles p
  left join colleges c on c.id = p.college_id
  where auth.uid() is not null
    and p.id = p_user_id;
$$;

comment on function get_public_profile is 'Safely retrieves public metadata for a student without exposing email or private account fields.';
grant execute on function get_public_profile(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. USER BLOCKING
-- ----------------------------------------------------------------------------

create table if not exists user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint chk_no_self_block check (blocker_id <> blocked_id),
  constraint uq_user_block unique (blocker_id, blocked_id)
);

create index if not exists ifs_idx_user_blocks_blocker on user_blocks(blocker_id);
create index if not exists ifs_idx_user_blocks_blocked on user_blocks(blocked_id);

alter table user_blocks enable row level security;

-- Idempotent policy replacements for user_blocks
drop policy if exists "user_blocks_select_own" on user_blocks;
create policy "user_blocks_select_own"
  on user_blocks for select
  to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "user_blocks_insert_own" on user_blocks;
create policy "user_blocks_insert_own"
  on user_blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "user_blocks_delete_own" on user_blocks;
create policy "user_blocks_delete_own"
  on user_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

create or replace function block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  if v_caller_id is null then
    raise exception 'Authentication required.';
  end if;
  if v_caller_id = p_blocked_id then
    raise exception 'You cannot block yourself.';
  end if;

  insert into user_blocks (blocker_id, blocked_id)
  values (v_caller_id, p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;
end;
$$;

grant execute on function block_user(uuid) to authenticated;

create or replace function unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
begin
  if v_caller_id is null then
    raise exception 'Authentication required.';
  end if;

  delete from user_blocks
  where blocker_id = v_caller_id and blocked_id = p_blocked_id;
end;
$$;

grant execute on function unblock_user(uuid) to authenticated;

create or replace function is_user_blocked(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_blocks
    where (blocker_id = auth.uid() and blocked_id = p_user_id)
       or (blocker_id = p_user_id and blocked_id = auth.uid())
  );
$$;

grant execute on function is_user_blocked(uuid) to authenticated;

create or replace function fetch_blocked_students()
returns table (
  id              uuid,
  name            text,
  avatar_url      text,
  college_name    text,
  department      text,
  year            smallint,
  blocked_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.avatar_url,
    c.name as college_name,
    p.department,
    p.year,
    ub.created_at as blocked_at
  from user_blocks ub
  join profiles p on p.id = ub.blocked_id
  left join colleges c on c.id = p.college_id
  where auth.uid() is not null
    and ub.blocker_id = auth.uid()
  order by ub.created_at desc;
$$;

comment on function fetch_blocked_students is 'Returns safe public metadata of students blocked by the authenticated caller.';
grant execute on function fetch_blocked_students to authenticated;

-- ----------------------------------------------------------------------------
-- 3. MODERATION REPORTS (WITH REPORT RETENTION & SNAPSHOT)
-- ----------------------------------------------------------------------------

create table if not exists user_reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid references profiles(id) on delete set null,
  reported_user_id  uuid references profiles(id) on delete set null,
  reported_name     text,
  reason            text not null check (reason in ('spam', 'harassment', 'inappropriate_behavior', 'inappropriate_profile', 'other')),
  description       text,
  status            text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at        timestamptz not null default now()
);

-- Ensure reported_name column exists if table was partially created earlier
alter table user_reports add column if not exists reported_name text;

-- Idempotent constraint
alter table user_reports drop constraint if exists chk_no_self_report;
alter table user_reports add constraint chk_no_self_report check (reporter_id is null or reported_user_id is null or reporter_id <> reported_user_id);

create index if not exists ifs_idx_user_reports_reporter on user_reports(reporter_id);
create index if not exists ifs_idx_user_reports_reported on user_reports(reported_user_id);

alter table user_reports enable row level security;

-- Idempotent policy replacements for user_reports
drop policy if exists "user_reports_insert_own" on user_reports;
create policy "user_reports_insert_own"
  on user_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "user_reports_select_own" on user_reports;
create policy "user_reports_select_own"
  on user_reports for select
  to authenticated
  using (reporter_id = auth.uid());

create or replace function report_user(
  p_reported_user_id uuid,
  p_reason           text,
  p_description      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_reported_name text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required.';
  end if;
  if v_caller_id = p_reported_user_id then
    raise exception 'You cannot report yourself.';
  end if;

  select name into v_reported_name from profiles where id = p_reported_user_id;

  insert into user_reports (reporter_id, reported_user_id, reported_name, reason, description)
  values (
    v_caller_id,
    p_reported_user_id,
    coalesce(v_reported_name, 'Unknown Student'),
    p_reason,
    trim(p_description)
  );
end;
$$;

grant execute on function report_user(uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. UPDATE SEARCH_STUDENTS RPC WITH BLOCK EXCLUSION
-- ----------------------------------------------------------------------------

-- Drop old signatures only if necessary to update return table columns
drop function if exists search_students(text, integer, integer);
drop function if exists search_students(text, integer, integer, text);

create or replace function search_students(
  p_query  text,
  p_limit  integer default 40,
  p_offset integer default 0,
  p_scope  text default 'same_college'
)
returns table (
  id              uuid,
  name            text,
  avatar_url      text,
  department      text,
  year            smallint,
  bio             text,
  students_helped integer,
  college_id      uuid,
  college_name    text,
  matched_skill   text,
  relevance       integer
)
language sql
stable
security definer
set search_path = public
as $$
  with matching_candidates as (
    select distinct on (p.id)
      p.id,
      p.name,
      p.avatar_url,
      p.department,
      p.year,
      p.bio,
      p.students_helped,
      p.college_id,
      c.name as college_name,
      s.name as matched_skill,
      case 
        when lower(s.name) = lower(p_query) then 3
        when lower(s.name) like lower(p_query) || '%' then 2
        else 1 
      end as relevance
    from profiles p
    join colleges c on c.id = p.college_id
    join user_skills us on us.user_id = p.id
    join skills s on s.id = us.skill_id
    where auth.uid() is not null
      and p.can_teach = true
      and p.id <> auth.uid()
      and s.name ilike '%' || p_query || '%'
      and (
        p_scope = 'any_college'
        or p.college_id = (select college_id from profiles where id = auth.uid())
      )
      and not exists (
        select 1 from user_blocks ub
        where (ub.blocker_id = auth.uid() and ub.blocked_id = p.id)
           or (ub.blocker_id = p.id and ub.blocked_id = auth.uid())
      )
    order by 
      p.id,
      case 
        when lower(s.name) = lower(p_query) then 3
        when lower(s.name) like lower(p_query) || '%' then 2
        else 1 
      end desc,
      length(s.name) asc
  )
  select
    id,
    name,
    avatar_url,
    department,
    year,
    bio,
    students_helped,
    college_id,
    college_name,
    matched_skill,
    relevance
  from matching_candidates
  order by relevance desc, students_helped desc, name asc
  limit p_limit offset p_offset;
$$;

grant execute on function search_students(text, integer, integer, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. BLOCK ENFORCEMENT ON REQUESTS & MESSAGES
-- ----------------------------------------------------------------------------

drop policy if exists "requests_insert_as_sender" on learning_requests;
create policy "requests_insert_as_sender"
  on learning_requests for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and not exists (
      select 1 from user_blocks ub
      where (ub.blocker_id = auth.uid() and ub.blocked_id = receiver_id)
         or (ub.blocker_id = receiver_id and ub.blocked_id = auth.uid())
    )
  );

drop policy if exists "messages_insert_member_as_self" on messages;
create policy "messages_insert_member_as_self"
  on messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
    )
    and not exists (
      select 1 from conversation_members cm_other
      join user_blocks ub on (
        (ub.blocker_id = auth.uid() and ub.blocked_id = cm_other.user_id)
        or (ub.blocker_id = cm_other.user_id and ub.blocked_id = auth.uid())
      )
      where cm_other.conversation_id = messages.conversation_id
        and cm_other.user_id <> auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 6. COMPLETE ACCOUNT DELETION RPC (WITH AUTH.USERS PURGE)
-- ----------------------------------------------------------------------------

create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  -- 1. Remove notifications
  delete from public.notifications where user_id = v_user_id;

  -- 2. Remove peer help records
  delete from public.peer_help_records where helper_id = v_user_id or student_id = v_user_id;

  -- 3. Remove user blocks
  delete from public.user_blocks where blocker_id = v_user_id or blocked_id = v_user_id;

  -- 4. Preserve moderation history: nullify reporter/reported FKs so report records survive account deletion
  update public.user_reports set reporter_id = null where reporter_id = v_user_id;
  update public.user_reports set reported_user_id = null where reported_user_id = v_user_id;

  -- 5. Remove user skills
  delete from public.user_skills where user_id = v_user_id;

  -- 6. Remove pending learning requests
  delete from public.learning_requests
  where (sender_id = v_user_id or receiver_id = v_user_id)
    and status = 'pending';

  -- 7. Remove conversation membership
  delete from public.conversation_members where user_id = v_user_id;

  -- 8. Remove profile record
  delete from public.profiles where id = v_user_id;

  -- 9. Permanently purge auth identity from auth.users
  delete from auth.users where id = v_user_id;
end;
$$;

comment on function delete_user_account is 'Permits authenticated users to permanently wipe their profile, skills, notifications, and underlying Supabase Auth identity from TechnIQ.';
grant execute on function delete_user_account to authenticated;
