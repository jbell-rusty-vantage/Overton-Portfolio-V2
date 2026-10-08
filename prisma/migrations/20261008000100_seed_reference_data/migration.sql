-- =============================================================================
-- Reference data + bootstrap admin. Idempotent (ON CONFLICT DO NOTHING) so it
-- never clobbers edits John makes later from the admin console or SQL editor.
-- =============================================================================

-- Bootstrap admin (password handed over out-of-band; must be changed on first login).
INSERT INTO admin_users (id, email, name, password_hash, must_change_password, updated_at)
VALUES (gen_random_uuid(), 'johnoverton743@gmail.com', 'John Overton',
        'scrypt$16384$8$1$/U7ZWVsjC9BfN0PRHsyljA==$Th6VTqsJMx9Lu/+UAV3wyScviUqIglLo+WWOB7a/ylbgqH+oAUTNoA4eNecd1uoOlkeD7fbyQ8sJk9CASDAkfA==', true, now())
ON CONFLICT (email) DO NOTHING;

-- Evolution stages (provisional — refined during the guided evolution ingestion).
INSERT INTO stages (code, label, description, sort_order) VALUES
  ('novice',           'Novice',            'First code, tutorials, courses — learning the shape of software.', 10),
  ('builder',          'Builder',           'Shipping small complete things end to end.', 20),
  ('full_stack',       'Full-Stack',        'Owning frontend, backend and data for real users.', 30),
  ('systems_data',     'Systems & Data',    'Pipelines, knowledge graphs, cloud infrastructure, data modeling.', 40),
  ('ai_agent_mastery', 'AI Agent Mastery',  'Agentic engineering: tools, MCP, multi-agent orchestration, evals, context management.', 50),
  ('production_grade', 'Production-Grade',  'Systems that hold up under real-world uncertainty: observability, reliability, scale.', 60)
ON CONFLICT (code) DO NOTHING;

-- Signal types.
INSERT INTO lk_signal_types (code, label, source, description, public_by_default, sort_order) VALUES
  ('github.push',          'Commits pushed',      'github', 'One or more commits pushed to a tracked repo.', true, 10),
  ('github.pull_request',  'Pull request',        'github', 'PR opened/merged/closed.', true, 20),
  ('github.release',       'Release',             'github', 'Release or tag published.', true, 30),
  ('github.workflow_run',  'CI run',              'github', 'GitHub Actions workflow completed.', false, 40),
  ('github.repo',          'Repository event',    'github', 'Repo created/renamed/visibility changed.', false, 50),
  ('vercel.deployment',    'Deployment',          'vercel', 'Vercel deployment created/succeeded/failed.', true, 60),
  ('admin.custom',         'Custom event',        'admin',  'Free-form event posted from the admin console.', true, 70),
  ('admin.now_building',   'Now building',        'admin',  'Status banner: what John is building right now (usually expires).', true, 80),
  ('admin.milestone',      'Milestone announced', 'admin',  'Announcement of a milestone.', true, 90),
  ('admin.status',         'Status update',       'admin',  'Short status update.', true, 100),
  ('system.post_published','New blog post',       'system', 'Emitted automatically when a post is first published.', true, 110),
  ('system.project_published','Project published','system', 'Emitted when a project is first published.', true, 120),
  ('system.media_uploaded','Media uploaded',      'system', 'Media asset uploaded (private by default).', false, 130),
  ('agent.action',         'Agent action',        'agent',  'An agent performed an approved action.', false, 140)
ON CONFLICT (code) DO NOTHING;

-- Media roles.
INSERT INTO lk_media_roles (code, label, description, sort_order) VALUES
  ('cover',        'Cover',            'Primary cover image.', 10),
  ('gallery',      'Gallery',          'General gallery item.', 20),
  ('screenshot',   'Screenshot',       'UI screenshot (also used for curated client work).', 30),
  ('demo',         'Demo',             'Demo video or walkthrough.', 40),
  ('diagram',      'Diagram',          'Architecture or flow diagram.', 50),
  ('page_texture', 'Book page texture','Image rendered onto a 3D book page.', 60),
  ('spine',        'Book spine',       'Spine artwork for the 3D book.', 70),
  ('scene_asset',  'Scene asset',      'GLB/texture used by the 3D library.', 80),
  ('inline',       'Inline',           'Referenced inline from MDX/blocks.', 90)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lk_skill_categories (code, label, sort_order) VALUES
  ('language',  'Languages', 10),
  ('frontend',  'Frontend', 20),
  ('backend',   'Backend', 30),
  ('data',      'Data & Databases', 40),
  ('ai',        'AI & Agents', 50),
  ('infra',     'Cloud & Infrastructure', 60),
  ('practice',  'Engineering Practice', 70)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lk_library_zone_kinds (code, label, description, sort_order) VALUES
  ('entrance',         'Entrance',         'Where visitors arrive and meet the librarian.', 10),
  ('stacks',           'The Stacks',       'Project books on themed shelves.', 20),
  ('evolution_hall',   'Evolution Hall',   'The Novice -> Production journey.', 30),
  ('periodicals',      'Periodicals',      'Blog posts and articles.', 40),
  ('favorites_wing',   'Favorites Wing',   'Favorite books, tools, supplements, devices, labs.', 50),
  ('reading_room',     'Reading Room',     'Courses, articles, case studies, reports.', 60),
  ('computer_station', 'Computer Station', 'Live deployed projects and the activity feed.', 70),
  ('archive',          'Archive',          'Older or retired work.', 80)
ON CONFLICT (code) DO NOTHING;

INSERT INTO favorite_categories (code, label, description, attribute_schema, sort_order) VALUES
  ('book',             'Books',                 'Favorite books.', '{"isbn":"string","year":"number","format":"string"}', 10),
  ('course',           'Courses',               'Courses and programs.', '{"provider":"string","completed_on":"date","certificate_url":"string"}', 20),
  ('article',          'Articles, Case Studies & Reports', 'Articles, case studies, research reports.', '{"publication":"string","published_on":"date","kind":"article|case_study|report"}', 30),
  ('ai_tool',          'AI Tools',              'Models, agent frameworks, AI products.', '{"vendor":"string","use_case":"string"}', 40),
  ('software_tool',    'Software Tools',        'Databases, web dev, infra and dev tools.', '{"area":"database|web|infra|devtools|other","vendor":"string"}', 50),
  ('supplement',       'Supplements',           'Supplements and protocols.', '{"brand":"string","dose":"string","timing":"string","purpose":"string"}', 60),
  ('longevity_device', 'Longevity Devices',     'Wearables and longevity hardware.', '{"brand":"string","model":"string","measures":"string[]"}', 70),
  ('lab_test',         'Lab Tests & Diagnostics','Longevity lab tests and diagnostics (biomarker results module planned).', '{"provider":"string","markers":"string[]","frequency":"string"}', 80)
ON CONFLICT (code) DO NOTHING;

-- Standard timelines.
INSERT INTO timelines (id, slug, kind, title, description, display, updated_at) VALUES
  (gen_random_uuid(), 'global',    'global',    'Everything, in order', 'Every published moment across all projects.', 'published', now()),
  (gen_random_uuid(), 'evolution', 'evolution', 'From Novice to Production', 'John''s software engineering evolution, stage by stage.', 'published', now())
ON CONFLICT (slug) DO NOTHING;

-- Default library layout (placeholder scene node names; the Blender scene will adopt these).
INSERT INTO library_zones (id, slug, kind_code, title, scene_node_name, sort_order) VALUES
  (gen_random_uuid(), 'entrance',         'entrance',         'Entrance & Front Desk', 'zone_entrance', 10),
  (gen_random_uuid(), 'stacks',           'stacks',           'The Stacks',            'zone_stacks', 20),
  (gen_random_uuid(), 'evolution-hall',   'evolution_hall',   'Evolution Hall',        'zone_evolution', 30),
  (gen_random_uuid(), 'periodicals',      'periodicals',      'Periodicals Rack',      'zone_periodicals', 40),
  (gen_random_uuid(), 'favorites-wing',   'favorites_wing',   'Favorites Wing',        'zone_favorites', 50),
  (gen_random_uuid(), 'reading-room',     'reading_room',     'Reading Room',          'zone_reading_room', 60),
  (gen_random_uuid(), 'computer-station', 'computer_station', 'Computer Station',      'zone_computer', 70)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO shelves (id, slug, zone_id, title, theme, scene_node_name, sort_order)
SELECT gen_random_uuid(), s.slug, z.id, s.title, s.theme, s.node, s.ord
FROM (VALUES
  ('stacks-ai-agents',      'stacks',         'AI & Agent Systems',       'ai',        'shelf_stacks_ai', 10),
  ('stacks-data-knowledge', 'stacks',         'Data & Knowledge Graphs',  'data',      'shelf_stacks_data', 20),
  ('stacks-web-apps',       'stacks',         'Web Applications',         'web',       'shelf_stacks_web', 30),
  ('stacks-client-work',    'stacks',         'Client Work',              'client',    'shelf_stacks_client', 40),
  ('evolution-timeline',    'evolution-hall', 'The Evolution',            'evolution', 'shelf_evolution', 10),
  ('periodicals-blog',      'periodicals',    'Latest Posts',             'blog',      'shelf_periodicals', 10),
  ('favorites-books',       'favorites-wing', 'Favorite Books',           'book',      'shelf_fav_books', 10),
  ('favorites-tools',       'favorites-wing', 'AI & Software Tools',      'tools',     'shelf_fav_tools', 20),
  ('favorites-longevity',   'favorites-wing', 'Longevity: Supplements, Devices & Labs', 'longevity', 'shelf_fav_longevity', 30),
  ('reading-room-courses',  'reading-room',   'Courses',                  'course',    'shelf_reading_courses', 10),
  ('reading-room-articles', 'reading-room',   'Articles, Case Studies & Reports', 'article', 'shelf_reading_articles', 20)
) AS s(slug, zone_slug, title, theme, node, ord)
JOIN library_zones z ON z.slug = s.zone_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO computer_screens (id, slot, mode, config, updated_at) VALUES
  (gen_random_uuid(), 'main', 'feed', '{"limit": 20}', now()),
  (gen_random_uuid(), 'side', 'iframe', '{}', now())
ON CONFLICT (slot) DO NOTHING;

INSERT INTO agents (id, code, name, description, is_public, updated_at) VALUES
  (gen_random_uuid(), 'librarian', 'The Librarian', 'Public eve agent: navigates the library and answers questions with curated tools.', true, now()),
  (gen_random_uuid(), 'admin',     'Admin Agent',   'Private eve agent + portfolio MCP: drafts freely; publish/delete go through approval_requests.', false, now())
ON CONFLICT (code) DO NOTHING;
