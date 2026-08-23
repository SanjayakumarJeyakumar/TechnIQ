-- ============================================================================
-- TechnIQ — Seed Data
-- Run AFTER all migrations. Safe to re-run (uses ON CONFLICT / guards).
--
-- Demo accounts are inserted directly into auth.users with a random password
-- hash — they exist purely so profiles.id (which FKs to auth.users.id) is
-- satisfiable, and so the app has believable data to demo. They are NOT
-- meant to be logged into via Google OAuth. profiles.is_demo = true marks
-- them clearly so the UI can badge them ("Demo Account") and so they can be
-- excluded from real-activity flows if you ever want to.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COLLEGES
-- ----------------------------------------------------------------------------

insert into colleges (id, name, email_domain) values
  ('11111111-1111-1111-1111-111111111101', 'Vellore Institute of Technology', 'vitstudent.ac.in'),
  ('11111111-1111-1111-1111-111111111102', 'SRM Institute of Science and Technology', 'srmist.edu.in'),
  ('11111111-1111-1111-1111-111111111103', 'Anna University', 'annauniv.edu'),
  ('11111111-1111-1111-1111-111111111104', 'IIT Madras', 'smail.iitm.ac.in'),
  ('11111111-1111-1111-1111-111111111105', 'PSG College of Technology', 'psgtech.ac.in')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- SKILLS
-- ----------------------------------------------------------------------------

insert into skills (name, category) values
  -- Technology / Web & Languages
  ('HTML', 'Technology'), ('CSS', 'Technology'), ('JavaScript', 'Technology'),
  ('TypeScript', 'Technology'), ('React', 'Technology'), ('Angular', 'Technology'),
  ('Vue', 'Technology'), ('Node.js', 'Technology'), ('Express.js', 'Technology'),
  ('Python', 'Technology'), ('Java', 'Technology'), ('C', 'Technology'),
  ('C++', 'Technology'), ('C#', 'Technology'), ('Go', 'Technology'),
  ('Rust', 'Technology'), ('PHP', 'Technology'), ('SQL', 'Technology'),
  ('MongoDB', 'Technology'), ('PostgreSQL', 'Technology'), ('MySQL', 'Technology'),
  ('Firebase', 'Technology'), ('Supabase', 'Technology'), ('Git', 'Technology'),
  ('GitHub', 'Technology'), ('Docker', 'Technology'), ('Kubernetes', 'Technology'),
  ('AWS', 'Technology'), ('Azure', 'Technology'), ('Google Cloud', 'Technology'),
  ('GraphQL', 'Technology'), ('REST APIs', 'Technology'), ('Next.js', 'Technology'),

  -- Mobile Development
  ('Android', 'Mobile Development'), ('Kotlin', 'Mobile Development'),
  ('Java (Android)', 'Mobile Development'), ('Flutter', 'Mobile Development'),
  ('React Native', 'Mobile Development'), ('Swift', 'Mobile Development'),
  ('iOS Development', 'Mobile Development'),

  -- AI / ML
  ('Machine Learning', 'AI / ML'), ('Deep Learning', 'AI / ML'), ('NLP', 'AI / ML'),
  ('Computer Vision', 'AI / ML'), ('Generative AI', 'AI / ML'), ('LLM', 'AI / ML'),
  ('Prompt Engineering', 'AI / ML'), ('TensorFlow', 'AI / ML'), ('PyTorch', 'AI / ML'),
  ('Scikit-learn', 'AI / ML'), ('Hugging Face', 'AI / ML'),

  -- Data
  ('Data Science', 'Data'), ('Data Analytics', 'Data'), ('Power BI', 'Data'),
  ('Tableau', 'Data'), ('Excel', 'Data'), ('Statistics', 'Data'),
  ('Data Visualization', 'Data'),

  -- Cybersecurity
  ('Ethical Hacking', 'Cybersecurity'), ('Network Security', 'Cybersecurity'),
  ('Cryptography', 'Cybersecurity'), ('Penetration Testing', 'Cybersecurity'),
  ('Cybersecurity', 'Cybersecurity'), ('Linux', 'Cybersecurity'),

  -- Design
  ('UI Design', 'Design'), ('UX Design', 'Design'), ('Figma', 'Design'),
  ('Graphic Design', 'Design'), ('Photoshop', 'Design'), ('Video Editing', 'Design'),
  ('Animation', 'Design'),

  -- Academic
  ('Mathematics', 'Academic'), ('Physics', 'Academic'), ('Chemistry', 'Academic'),
  ('Biology', 'Academic'), ('Data Structures', 'Academic'), ('Algorithms', 'Academic'),
  ('Operating Systems', 'Academic'), ('Computer Networks', 'Academic'),
  ('Database Management', 'Academic'), ('Software Engineering', 'Academic'),
  ('Cloud Computing', 'Academic'), ('Artificial Intelligence', 'Academic'),
  ('Computer Architecture', 'Academic'),

  -- Communication / General
  ('Public Speaking', 'Communication'), ('Communication', 'Communication'),
  ('English', 'Communication'), ('Presentation', 'Communication'),
  ('Leadership', 'Communication'), ('Teamwork', 'Communication'),
  ('Interview Preparation', 'Communication'), ('Resume Building', 'Communication')
on conflict (name) do nothing;

-- ----------------------------------------------------------------------------
-- DEMO AUTH USERS
-- Minimal columns needed for a valid auth.users row. instance_id is the
-- default Supabase instance id (all zeros) used by every project.
-- ----------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222201', 'authenticated', 'authenticated', 'ananya.demo@vitstudent.ac.in', crypt('demo-not-a-real-login', gen_salt('bf')), now(), '{"provider":"google"}', '{"full_name":"Ananya Sharma"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222202', 'authenticated', 'authenticated', 'rahul.demo@vitstudent.ac.in',  crypt('demo-not-a-real-login', gen_salt('bf')), now(), '{"provider":"google"}', '{"full_name":"Rahul Menon"}',   now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222203', 'authenticated', 'authenticated', 'divya.demo@srmist.edu.in',     crypt('demo-not-a-real-login', gen_salt('bf')), now(), '{"provider":"google"}', '{"full_name":"Divya Krishnan"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222204', 'authenticated', 'authenticated', 'karthik.demo@srmist.edu.in',   crypt('demo-not-a-real-login', gen_salt('bf')), now(), '{"provider":"google"}', '{"full_name":"Karthik Iyer"}',  now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222205', 'authenticated', 'authenticated', 'meera.demo@vitstudent.ac.in',  crypt('demo-not-a-real-login', gen_salt('bf')), now(), '{"provider":"google"}', '{"full_name":"Meera Nair"}',    now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222206', 'authenticated', 'authenticated', 'arjun.demo@vitstudent.ac.in',  crypt('demo-not-a-real-login', gen_salt('bf')), now(), '{"provider":"google"}', '{"full_name":"Arjun Reddy"}',   now(), now())
on conflict (id) do nothing;

-- The handle_new_auth_user() trigger already fired for the inserts above and
-- created bare profiles rows. We now UPDATE them with full demo details
-- rather than inserting again.

update profiles set
  department = 'Computer Science', year = 3, is_demo = true, can_teach = true,
  bio = 'CS junior who loves frontend work. Happy to pair on React or JS fundamentals.',
  avatar_url = null
where id = '22222222-2222-2222-2222-222222222201';

update profiles set
  department = 'Information Technology', year = 4, is_demo = true, can_teach = true,
  bio = 'Backend-leaning senior, into Node.js and databases. TA for DBMS last semester.',
  avatar_url = null
where id = '22222222-2222-2222-2222-222222222202';

update profiles set
  department = 'Computer Science', year = 2, is_demo = true, can_teach = false,
  bio = 'Still learning the ropes — mostly here to find people who can teach me ML.',
  avatar_url = null
where id = '22222222-2222-2222-2222-222222222203';

update profiles set
  department = 'AI & Data Science', year = 3, is_demo = true, can_teach = true,
  bio = 'ML enthusiast, built a couple of Kaggle projects. Can help with Python + basics of ML.',
  avatar_url = null
where id = '22222222-2222-2222-2222-222222222204';

update profiles set
  department = 'Computer Science', year = 3, is_demo = true, can_teach = true,
  bio = 'Design-minded dev — comfortable with Figma, UI design, and React.',
  avatar_url = null
where id = '22222222-2222-2222-2222-222222222205';

update profiles set
  department = 'Electronics', year = 4, is_demo = true, can_teach = false,
  bio = 'EEE background, picking up software skills on the side.',
  avatar_url = null
where id = '22222222-2222-2222-2222-222222222206';

-- ----------------------------------------------------------------------------
-- DEMO USER_SKILLS
-- ----------------------------------------------------------------------------

insert into user_skills (user_id, skill_id)
select '22222222-2222-2222-2222-222222222201', id from skills where name in ('HTML','CSS','JavaScript','React')
union all
select '22222222-2222-2222-2222-222222222202', id from skills where name in ('Node.js','Express.js','PostgreSQL','SQL','Git')
union all
select '22222222-2222-2222-2222-222222222203', id from skills where name in ('Python','Statistics')
union all
select '22222222-2222-2222-2222-222222222204', id from skills where name in ('Python','Machine Learning','TensorFlow','Data Science')
union all
select '22222222-2222-2222-2222-222222222205', id from skills where name in ('Figma','UI Design','UX Design','React')
union all
select '22222222-2222-2222-2222-222222222206', id from skills where name in ('C','Java')
on conflict do nothing;

-- Note: real students created through actual Google OAuth + onboarding will
-- flow through handle_new_auth_user() + the onboarding UI, not this file.
