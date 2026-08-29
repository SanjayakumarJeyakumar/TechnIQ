-- ============================================================================
-- TechnIQ — Migration 0009: College Leaderboard RPC
-- Safely fetches top student helpers from the caller's college with skills
-- without exposing email addresses or bypassing profile privacy RLS policies.
-- ============================================================================

create or replace function fetch_college_leaderboard(
  p_limit integer default 20
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
  skills          jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with caller_info as (
    select college_id from profiles where id = auth.uid()
  ),
  college_students as (
    select
      p.id,
      p.name,
      p.avatar_url,
      p.department,
      p.year,
      p.bio,
      p.students_helped,
      p.college_id,
      c.name as college_name
    from profiles p
    join caller_info ci on ci.college_id is not null and p.college_id = ci.college_id
    left join colleges c on c.id = p.college_id
    where auth.uid() is not null
    order by p.students_helped desc, p.name asc
    limit p_limit
  )
  select
    cs.id,
    cs.name,
    cs.avatar_url,
    cs.department,
    cs.year,
    cs.bio,
    cs.students_helped,
    cs.college_id,
    cs.college_name,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'category', s.category
          )
          order by s.name asc
        )
        from user_skills us
        join skills s on s.id = us.skill_id
        where us.user_id = cs.id
      ),
      '[]'::jsonb
    ) as skills
  from college_students cs
  order by cs.students_helped desc, cs.name asc;
$$;

comment on function fetch_college_leaderboard is 'Safely returns ranked student helpers from the authenticated caller''s college with public fields and skills.';
grant execute on function fetch_college_leaderboard(integer) to authenticated;
