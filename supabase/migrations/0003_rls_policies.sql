-- ============================================================================
-- TechnIQ — Migration 0003: Row Level Security
-- Default-deny on every table; explicit policies for exactly what's needed.
-- ============================================================================

alter table colleges              enable row level security;
alter table profiles              enable row level security;
alter table skills                enable row level security;
alter table user_skills           enable row level security;
alter table learning_requests     enable row level security;
alter table conversations         enable row level security;
alter table conversation_members  enable row level security;
alter table messages              enable row level security;
alter table notifications         enable row level security;

-- ----------------------------------------------------------------------------
-- COLLEGES — public read (needed for onboarding dropdown), no client writes.
-- ----------------------------------------------------------------------------

create policy "colleges_select_all"
  on colleges for select
  using (true);

-- No insert/update/delete policies → only the service role (which bypasses
-- RLS) can manage colleges. Admin-curated, as designed.

-- ----------------------------------------------------------------------------
-- PROFILES
-- Public profile info is readable by any authenticated user (needed to view
-- another student's profile / search results). Users can only modify their
-- own row, and can never write students_helped or is_demo themselves.
-- ----------------------------------------------------------------------------

create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and students_helped = (select students_helped from profiles where id = auth.uid())
    and is_demo = (select is_demo from profiles where id = auth.uid())
  );

-- No client-side insert policy: profile rows are created only by the
-- handle_new_auth_user() trigger (security definer, bypasses RLS).
-- No delete policy: account deletion is handled server-side via the
-- auth.users cascade, not a direct client delete.

-- ----------------------------------------------------------------------------
-- SKILLS — public read, no client writes (curated taxonomy).
-- ----------------------------------------------------------------------------

create policy "skills_select_all"
  on skills for select
  using (true);

-- ----------------------------------------------------------------------------
-- USER_SKILLS — a user manages only their own skill list. Anyone
-- authenticated can read (needed to display another student's skills on
-- their profile/search results).
-- ----------------------------------------------------------------------------

create policy "user_skills_select_authenticated"
  on user_skills for select
  to authenticated
  using (true);

create policy "user_skills_insert_own"
  on user_skills for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_skills_delete_own"
  on user_skills for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- LEARNING_REQUESTS
-- A user can see requests where they are sender or receiver. Only the
-- sender can create a request as themselves. Only the receiver can change
-- status (accept/reject); the sender may cancel their own pending request.
-- ----------------------------------------------------------------------------

create policy "requests_select_involved"
  on learning_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "requests_insert_as_sender"
  on learning_requests for insert
  to authenticated
  with check (sender_id = auth.uid());

create policy "requests_receiver_updates_status"
  on learning_requests for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (
    receiver_id = auth.uid()
    and sender_id = (select sender_id from learning_requests where id = learning_requests.id)
  );

create policy "requests_sender_cancels_own_pending"
  on learning_requests for update
  to authenticated
  using (sender_id = auth.uid() and status = 'pending')
  with check (sender_id = auth.uid() and status = 'cancelled');

-- ----------------------------------------------------------------------------
-- CONVERSATIONS — readable only if you're a member. No direct client insert
-- (created only by the accept-request trigger, security definer).
-- ----------------------------------------------------------------------------

create policy "conversations_select_member"
  on conversations for select
  to authenticated
  using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = conversations.id
        and cm.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- CONVERSATION_MEMBERS — a user can see the membership rows of conversations
-- they belong to (needed to know "who am I chatting with"). No client writes
-- (membership is trigger-managed).
-- ----------------------------------------------------------------------------

create policy "conv_members_select_own_conversations"
  on conversation_members for select
  to authenticated
  using (
    exists (
      select 1 from conversation_members cm2
      where cm2.conversation_id = conversation_members.conversation_id
        and cm2.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- MESSAGES — read/send only inside conversations you belong to. This is the
-- actual enforcement point for "no messaging without an accepted request",
-- since conversations only ever get created by the accept trigger.
-- ----------------------------------------------------------------------------

create policy "messages_select_member"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
    )
  );

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
  );

create policy "messages_update_own_read_state"
  on messages for update
  to authenticated
  using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = auth.uid()
    )
  )
  with check (sender_id = (select sender_id from messages m where m.id = messages.id));

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS — a user can only see/update their own. No client insert
-- (all notifications are trigger-generated, security definer).
-- ----------------------------------------------------------------------------

create policy "notifications_select_own"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own_read_state"
  on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
