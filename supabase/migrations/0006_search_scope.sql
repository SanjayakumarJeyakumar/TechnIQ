-- ============================================================================
-- TechnIQ — Migration 0006: Search Scope & Unique Student Results
-- Extends search_students RPC to securely support 'same_college' (default)
-- and 'any_college' discovery modes, returning safe public fields including
-- the student's college name, while guaranteeing each student appears exactly
-- once with their most relevant matched skill.
-- ============================================================================

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

comment on function search_students is 'Skill search with scope support (same_college vs any_college) and deduplication (DISTINCT ON student id). Strictly enforces authenticated caller, can_teach, self-exclusion, and college boundary when scope is same_college.';
