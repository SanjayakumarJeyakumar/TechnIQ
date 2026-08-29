-- ============================================================================
-- TechnIQ — Migration 0008: Peer Endorsements & Reputation
-- Structured, tag-based peer endorsements tied to verified help records.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PEER_ENDORSEMENTS TABLE
-- ----------------------------------------------------------------------------

create table if not exists peer_endorsements (
  id              uuid primary key default gen_random_uuid(),
  help_record_id  uuid not null references peer_help_records(id) on delete cascade,
  helper_id       uuid not null references profiles(id) on delete cascade,
  student_id      uuid not null references profiles(id) on delete cascade,
  tag             text not null check (tag in (
    'clear_explainer',
    'technical_expert',
    'patient_helpful',
    'great_debugger',
    'problem_solver',
    'practical_guidance',
    'good_teacher',
    'highly_recommended'
  )),
  created_at      timestamptz not null default now(),
  constraint uq_help_record_tag unique (help_record_id, tag),
  constraint chk_no_self_endorse check (helper_id <> student_id)
);

create index if not exists idx_peer_endorsements_helper on peer_endorsements (helper_id);
create index if not exists idx_peer_endorsements_student on peer_endorsements (student_id);
create index if not exists idx_peer_endorsements_record on peer_endorsements (help_record_id);

alter table peer_endorsements enable row level security;

-- Idempotent RLS Policies
drop policy if exists "peer_endorsements_select_authenticated" on peer_endorsements;
create policy "peer_endorsements_select_authenticated"
  on peer_endorsements for select
  to authenticated
  using (true);

drop policy if exists "peer_endorsements_insert_student" on peer_endorsements;
create policy "peer_endorsements_insert_student"
  on peer_endorsements for insert
  to authenticated
  with check (student_id = auth.uid());

drop policy if exists "peer_endorsements_delete_student" on peer_endorsements;
create policy "peer_endorsements_delete_student"
  on peer_endorsements for delete
  to authenticated
  using (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. UPGRADED RECORD_STUDENT_HELPED RPC WITH OPTIONAL ENDORSEMENT TAGS
-- ----------------------------------------------------------------------------

-- Drop older signatures if any to ensure clean resolution
drop function if exists record_student_helped(uuid, uuid);
drop function if exists record_student_helped(uuid, uuid, text[]);

create or replace function record_student_helped(
  p_helper_id uuid,
  p_skill_id  uuid,
  p_tags      text[] default array[]::text[]
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
  v_record_id        uuid;
  v_tag              text;
  v_valid_tags       text[] := array[
    'clear_explainer',
    'technical_expert',
    'patient_helpful',
    'great_debugger',
    'problem_solver',
    'practical_guidance',
    'good_teacher',
    'highly_recommended'
  ];
  v_tag_labels       text[] := array[]::text[];
  v_notif_msg        text;
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

  -- Block check: ensure neither participant has blocked the other
  if exists (
    select 1 from user_blocks
    where (blocker_id = v_student_id and blocked_id = p_helper_id)
       or (blocker_id = p_helper_id and blocked_id = v_student_id)
  ) then
    raise exception 'Cannot record help between blocked users.';
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
  values (p_helper_id, v_student_id, p_skill_id)
  returning id into v_record_id;

  -- Increment helper's students_helped counter
  update profiles
  set students_helped = students_helped + 1
  where id = p_helper_id
  returning students_helped into v_new_helped_count;

  -- Fetch skill name
  select name into v_skill_name from skills where id = p_skill_id;

  -- Save validated endorsement tags (if provided)
  if p_tags is not null and array_length(p_tags, 1) > 0 then
    foreach v_tag in array p_tags loop
      if v_tag = any(v_valid_tags) then
        insert into peer_endorsements (help_record_id, helper_id, student_id, tag)
        values (v_record_id, p_helper_id, v_student_id, v_tag)
        on conflict (help_record_id, tag) do nothing;

        -- Map tag to display label for notification
        case v_tag
          when 'clear_explainer' then v_tag_labels := array_append(v_tag_labels, 'Clear Explainer');
          when 'technical_expert' then v_tag_labels := array_append(v_tag_labels, 'Technical Expert');
          when 'patient_helpful' then v_tag_labels := array_append(v_tag_labels, 'Patient & Helpful');
          when 'great_debugger' then v_tag_labels := array_append(v_tag_labels, 'Great Debugger');
          when 'problem_solver' then v_tag_labels := array_append(v_tag_labels, 'Problem Solver');
          when 'practical_guidance' then v_tag_labels := array_append(v_tag_labels, 'Practical Guidance');
          when 'good_teacher' then v_tag_labels := array_append(v_tag_labels, 'Good Teacher');
          when 'highly_recommended' then v_tag_labels := array_append(v_tag_labels, 'Highly Recommended');
        end case;
      end if;
    end loop;
  end if;

  -- Create single consolidated notification for helper
  if array_length(v_tag_labels, 1) > 0 then
    v_notif_msg := v_student_name || ' endorsed you as ' || array_to_string(v_tag_labels, ', ') || ' for ' || v_skill_name || '!';
  else
    v_notif_msg := v_student_name || ' confirmed that you helped them learn ' || v_skill_name || '!';
  end if;

  insert into notifications (user_id, type, reference_id, message)
  values (p_helper_id, 'request_accepted', p_helper_id, v_notif_msg);

  return json_build_object(
    'success', true,
    'students_helped', v_new_helped_count,
    'skill_name', v_skill_name,
    'endorsements_count', coalesce(array_length(v_tag_labels, 1), 0)
  );
end;
$$;

comment on function record_student_helped is 'Securely records verified help, saves optional peer endorsements, increments helper counter, and creates a consolidated notification.';
grant execute on function record_student_helped(uuid, uuid, text[]) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. FETCH STUDENT ENDORSEMENTS RPC
-- ----------------------------------------------------------------------------

create or replace function fetch_student_endorsements(p_user_id uuid)
returns table (
  tag   text,
  count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pe.tag,
    count(*)::bigint as count
  from peer_endorsements pe
  where pe.helper_id = p_user_id
  group by pe.tag
  order by count desc, pe.tag asc;
$$;

comment on function fetch_student_endorsements is 'Returns aggregated peer endorsement counts for a student helper.';
grant execute on function fetch_student_endorsements(uuid) to authenticated;
