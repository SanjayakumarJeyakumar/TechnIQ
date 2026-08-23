-- ============================================================================
-- TechnIQ — Migration 0002: Functions & Triggers
-- All server-enforced business logic lives here so it can't be bypassed by
-- a client that skips the "right" code path.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generic updated_at maintenance
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_requests_updated_at
  before update on learning_requests
  for each row execute function set_updated_at();

create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- New profile auto-provisioning
-- Fires when a Google OAuth user is created. Creates a bare profile row
-- (no college/skills yet) so onboarding has something to update rather than
-- insert, and so "does a profile exist" checks are trivial. College/name/
-- avatar are pre-filled from the Google identity where available; onboarding
-- lets the user confirm/correct them.
-- ----------------------------------------------------------------------------

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email        text := new.email;
  v_domain       text := split_part(new.email, '@', 2);
  v_college_id   uuid;
begin
  select id into v_college_id from colleges where email_domain = lower(v_domain) limit 1;

  insert into profiles (id, email, name, avatar_url, college_id)
  values (
    new.id,
    v_email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(v_email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_college_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- Notify receiver when a new learning request comes in
-- ----------------------------------------------------------------------------

create or replace function notify_request_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
  v_skill_name  text;
begin
  select name into v_sender_name from profiles where id = new.sender_id;
  select name into v_skill_name from skills where id = new.skill_id;

  insert into notifications (user_id, type, reference_id, message)
  values (
    new.receiver_id,
    'request_received',
    new.id,
    v_sender_name || ' wants help with ' || v_skill_name
  );

  return new;
end;
$$;

create trigger trg_notify_request_received
  after insert on learning_requests
  for each row execute function notify_request_received();

-- ----------------------------------------------------------------------------
-- Handle status transitions: accepted → create conversation + notify + bump
-- students_helped. rejected → notify only. This is the single source of
-- truth for "what happens when a request is accepted" — the leaderboard
-- guarantee (§14 of the architecture doc) depends on this being the ONLY
-- place students_helped is ever incremented.
-- ----------------------------------------------------------------------------

create or replace function handle_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_skill_name       text;
  v_receiver_name    text;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'accepted' then
    -- Find an existing conversation between these two users, if any (so
    -- multiple accepted requests between the same pair share one thread).
    select cm1.conversation_id into v_conversation_id
    from conversation_members cm1
    join conversation_members cm2
      on cm1.conversation_id = cm2.conversation_id
     and cm2.user_id = new.receiver_id
    where cm1.user_id = new.sender_id
    limit 1;

    if v_conversation_id is null then
      insert into conversations default values returning id into v_conversation_id;
      insert into conversation_members (conversation_id, user_id) values
        (v_conversation_id, new.sender_id),
        (v_conversation_id, new.receiver_id);
    end if;

    update profiles set students_helped = students_helped + 1 where id = new.receiver_id;

    select name into v_receiver_name from profiles where id = new.receiver_id;
    select name into v_skill_name from skills where id = new.skill_id;

    insert into notifications (user_id, type, reference_id, message)
    values (
      new.sender_id,
      'request_accepted',
      new.id,
      v_receiver_name || ' accepted your request for ' || v_skill_name
    );

  elsif new.status = 'rejected' then
    select name into v_receiver_name from profiles where id = new.receiver_id;
    select name into v_skill_name from skills where id = new.skill_id;

    insert into notifications (user_id, type, reference_id, message)
    values (
      new.sender_id,
      'request_rejected',
      new.id,
      v_receiver_name || ' declined your request for ' || v_skill_name
    );
  end if;

  return new;
end;
$$;

create trigger trg_request_status_change
  after update of status on learning_requests
  for each row execute function handle_request_status_change();

-- ----------------------------------------------------------------------------
-- Notify on new message (for the recipient's notification bell / badge).
-- Notifies every OTHER member of the conversation, not just a fixed "the
-- other user", so this still works if group conversations are added later.
-- ----------------------------------------------------------------------------

create or replace function notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
begin
  select name into v_sender_name from profiles where id = new.sender_id;

  insert into notifications (user_id, type, reference_id, message)
  select cm.user_id, 'new_message', new.id, v_sender_name || ' sent you a message'
  from conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;

  update conversations set updated_at = now() where id = new.conversation_id;

  return new;
end;
$$;

create trigger trg_notify_new_message
  after insert on messages
  for each row execute function notify_new_message();

-- ----------------------------------------------------------------------------
-- search_students RPC
-- The single enforced query for skill discovery: same-college, can_teach,
-- matches the skill query, excludes the requester, no duplicates.
-- Called from the frontend as: supabase.rpc('search_students', { p_query, p_limit, p_offset })
-- ----------------------------------------------------------------------------

create or replace function search_students(
  p_query  text,
  p_limit  integer default 20,
  p_offset integer default 0
)
returns table (
  id              uuid,
  name            text,
  avatar_url      text,
  department      text,
  year            smallint,
  bio             text,
  students_helped integer,
  matched_skill   text,
  relevance       integer
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
    s.name as matched_skill,
    case when lower(s.name) = lower(p_query) then 2 else 1 end as relevance
  from profiles p
  join user_skills us on us.user_id = p.id
  join skills s on s.id = us.skill_id
  where p.college_id = (select college_id from profiles where id = auth.uid())
    and p.can_teach = true
    and p.id <> auth.uid()
    and s.name ilike '%' || p_query || '%'
  order by relevance desc, p.students_helped desc
  limit p_limit offset p_offset;
$$;

comment on function search_students is 'Enforces same-college + can_teach + skill match + self-exclusion server-side. This is the query the frontend search bar should call — never replicate this filter logic client-side.';
