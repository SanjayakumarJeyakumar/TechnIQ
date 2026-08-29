-- ============================================================================
-- TechnIQ — Migration 0005: Peer Help Records & Endorsement RPC
-- Enables students to mark that a classmate helped them with a specific skill.
-- Securely increments profiles.students_helped and prevents duplicate counting.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PEER_HELP_RECORDS TABLE
-- ----------------------------------------------------------------------------

create table if not exists peer_help_records (
  id           uuid primary key default gen_random_uuid(),
  helper_id    uuid not null references profiles(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade, -- user who received help
  skill_id     uuid not null references skills(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint chk_no_self_help check (helper_id <> student_id),
  constraint uq_peer_help_triple unique (helper_id, student_id, skill_id)
);

comment on table peer_help_records is 'Tracks verified peer-to-peer help interactions where a student marks another as having helped them learn a skill.';

create index if not exists idx_peer_help_helper on peer_help_records (helper_id);
create index if not exists idx_peer_help_student on peer_help_records (student_id);

alter table peer_help_records enable row level security;

-- Authenticated users can read help records
create policy "peer_help_select_authenticated"
  on peer_help_records for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- record_student_helped RPC
-- Secure function to validate and record help, incrementing helper's counter.
-- ----------------------------------------------------------------------------

create or replace function record_student_helped(
  p_helper_id uuid,
  p_skill_id  uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id       uuid := auth.uid();
  v_student_name     text;
  v_skill_name       text;
  v_helper_college   uuid;
  v_student_college   uuid;
  v_new_helped_count integer;
begin
  if v_student_id is null then
    raise exception 'You must be authenticated to mark a student as helped.';
  end if;

  if v_student_id = p_helper_id then
    raise exception 'You cannot mark yourself as helped.';
  end if;

  -- Verify both students belong to the same college
  select college_id into v_helper_college from profiles where id = p_helper_id;
  select college_id, name into v_student_college, v_student_name from profiles where id = v_student_id;

  if v_helper_college is null or v_student_college is null or v_helper_college <> v_student_college then
    raise exception 'Both students must belong to the same college.';
  end if;

  -- Verify the helper actually has this skill
  if not exists (select 1 from user_skills where user_id = p_helper_id and skill_id = p_skill_id) then
    raise exception 'The selected skill is not in this student''s skill profile.';
  end if;

  -- Prevent duplicate help submissions for the same helper + student + skill
  if exists (
    select 1 from peer_help_records
    where helper_id = p_helper_id
      and student_id = v_student_id
      and skill_id = p_skill_id
  ) then
    raise exception 'You have already marked this student as helping you with this skill.';
  end if;

  -- Record the help event
  insert into peer_help_records (helper_id, student_id, skill_id)
  values (p_helper_id, v_student_id, p_skill_id);

  -- Increment the helper's students_helped counter
  update profiles
  set students_helped = students_helped + 1
  where id = p_helper_id
  returning students_helped into v_new_helped_count;

  -- Fetch skill name for notification
  select name into v_skill_name from skills where id = p_skill_id;

  -- Send notification to helper
  insert into notifications (user_id, type, reference_id, message)
  values (
    p_helper_id,
    'request_accepted',
    p_helper_id,
    v_student_name || ' confirmed that you helped them learn ' || v_skill_name || '!'
  );

  return json_build_object(
    'success', true,
    'students_helped', v_new_helped_count,
    'skill_name', v_skill_name
  );
end;
$$;

comment on function record_student_helped is 'Securely records that a student was helped by a peer, enforces same-college and skill checks, prevents duplicates, and increments helper score.';
