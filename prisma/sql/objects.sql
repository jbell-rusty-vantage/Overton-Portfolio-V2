-- =============================================================================
-- Database objects Prisma does not manage: triggers, views, helper functions.
-- Source of truth for these lives here; they are copied into migrations.
-- Everything is CREATE OR REPLACE so this file can be re-applied safely.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- updated_at trigger: Prisma sets updated_at on client writes; this keeps it
-- correct for edits made directly in the Neon SQL editor / MCP as well.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION set_updated_at() IS 'Trigger: bump updated_at on every UPDATE.';

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$I', t.table_name);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t.table_name);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Live feed notifications: NOTIFY 'activity_events' with the new row id so a
-- realtime fan-out worker (SSE/Ably/etc.) can LISTEN instead of polling.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_activity_event() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('activity_events', json_build_object(
    'id', NEW.id, 'type', NEW.type_code, 'visibility', NEW.visibility, 'occurred_at', NEW.occurred_at
  )::text);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_activity_events_notify ON activity_events;
CREATE TRIGGER trg_activity_events_notify AFTER INSERT ON activity_events
  FOR EACH ROW EXECUTE FUNCTION notify_activity_event();

-- ---------------------------------------------------------------------------
-- Views — one-line answers to the common questions.
-- ---------------------------------------------------------------------------

-- Public, unexpired signals, newest first (what the realtime feed shows).
CREATE OR REPLACE VIEW v_live_feed AS
SELECT
  e.id, e.occurred_at, e.source, e.type_code, t.label AS type_label,
  e.title, e.summary, e.url, e.scene_effect, e.actor,
  e.project_id, p.slug AS project_slug, p.title AS project_title,
  e.repo_id, COALESCE(r.public_alias, r.full_name) AS repo_name
FROM activity_events e
JOIN lk_signal_types t ON t.code = e.type_code
LEFT JOIN projects p ON p.id = e.project_id
LEFT JOIN repos r ON r.id = e.repo_id
WHERE e.visibility = 'public'
  AND (e.expires_at IS NULL OR e.expires_at > now())
ORDER BY e.occurred_at DESC;
COMMENT ON VIEW v_live_feed IS 'Public, unexpired signals newest first — what visitors see in the live feed.';

-- Every project with its counts, primary deployment and cover.
CREATE OR REPLACE VIEW v_project_overview AS
SELECT
  p.id, p.slug, p.title, p.tagline, p.status, p.display, p.activation,
  p.stage_code, s.label AS stage_label, p.started_on, p.ended_on, p.featured_rank,
  COALESCE(c.public_alias, CASE WHEN c.show_name THEN c.name END) AS client_label,
  cover.url AS cover_url,
  (SELECT count(*) FROM project_repos pr WHERE pr.project_id = p.id) AS repo_count,
  (SELECT count(*) FROM project_deployments pd WHERE pd.project_id = p.id) AS deployment_count,
  (SELECT d.url FROM project_deployments pd JOIN deployments d ON d.id = pd.deployment_id
     WHERE pd.project_id = p.id ORDER BY pd.is_primary DESC, d.sort_order LIMIT 1) AS primary_url,
  (SELECT count(*) FROM timeline_nodes n WHERE n.project_id = p.id AND n.deleted_at IS NULL) AS moment_count,
  (SELECT max(e.occurred_at) FROM activity_events e WHERE e.project_id = p.id) AS last_activity_at,
  p.updated_at
FROM projects p
LEFT JOIN stages s ON s.code = p.stage_code
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN media_assets cover ON cover.id = p.cover_media_id
WHERE p.deleted_at IS NULL;
COMMENT ON VIEW v_project_overview IS 'One row per (non-deleted) project with counts, primary URL, cover and last activity.';

-- Moments placed on timelines, in order.
CREATE OR REPLACE VIEW v_timeline AS
SELECT
  tl.slug AS timeline_slug, tl.kind AS timeline_kind, tl.title AS timeline_title,
  m.position, m.chapter_label,
  n.id AS node_id, n.slug AS node_slug, n.title, n.summary, n.kind, n.occurred_at, n.occurred_until,
  n.precision, n.importance, n.display, n.stage_code, s.label AS stage_label, s.sort_order AS stage_order,
  n.project_id, p.slug AS project_slug, p.title AS project_title,
  (SELECT count(*) FROM timeline_node_signals x WHERE x.node_id = n.id) AS signal_count
FROM timeline_memberships m
JOIN timelines tl ON tl.id = m.timeline_id
JOIN timeline_nodes n ON n.id = m.node_id AND n.deleted_at IS NULL
LEFT JOIN stages s ON s.code = n.stage_code
LEFT JOIN projects p ON p.id = n.project_id
ORDER BY tl.slug, m.position, n.occurred_at;
COMMENT ON VIEW v_timeline IS 'Moments on every timeline, ordered by position then date.';

-- The Novice -> Production story, grouped by stage.
CREATE OR REPLACE VIEW v_evolution AS
SELECT * FROM v_timeline WHERE timeline_kind = 'evolution'
ORDER BY stage_order NULLS LAST, occurred_at;
COMMENT ON VIEW v_evolution IS 'The evolution timeline (Novice -> Production) ordered by stage then date.';

-- Library layout with each slot resolved to a human title.
CREATE OR REPLACE VIEW v_library_shelves AS
SELECT
  z.slug AS zone_slug, z.title AS zone_title, z.kind_code AS zone_kind, z.scene_node_name AS zone_scene_node,
  sh.slug AS shelf_slug, sh.title AS shelf_title, sh.theme, sh.scene_node_name AS shelf_scene_node,
  sl.position, sl.entity_type, sl.entity_id,
  CASE sl.entity_type
    WHEN 'project'  THEN (SELECT title FROM projects WHERE id = sl.entity_id)
    WHEN 'post'     THEN (SELECT title FROM posts WHERE id = sl.entity_id)
    WHEN 'favorite' THEN (SELECT title FROM favorites WHERE id = sl.entity_id)
    WHEN 'book'     THEN (SELECT title FROM books WHERE id = sl.entity_id)
    WHEN 'timeline' THEN (SELECT title FROM timelines WHERE id = sl.entity_id)
    WHEN 'deployment' THEN (SELECT title FROM deployments WHERE id = sl.entity_id)
  END AS entity_title,
  sl.spine_style
FROM library_zones z
JOIN shelves sh ON sh.zone_id = z.id
LEFT JOIN shelf_slots sl ON sl.shelf_id = sh.id
ORDER BY z.sort_order, sh.sort_order, sl.position;
COMMENT ON VIEW v_library_shelves IS 'Zones -> shelves -> slots with the title of whatever sits in each slot.';

CREATE OR REPLACE VIEW v_favorites_by_category AS
SELECT
  c.code AS category_code, c.label AS category_label, c.sort_order AS category_order,
  f.id, f.slug, f.title, f.creator, f.rating, f.status, f.url, f.display, f.sort_order, f.attributes
FROM favorite_categories c
JOIN favorites f ON f.category_code = c.code AND f.deleted_at IS NULL
ORDER BY c.sort_order, f.sort_order, f.title;
COMMENT ON VIEW v_favorites_by_category IS 'Favorites grouped and ordered by category.';

CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT a.id, a.created_at, a.requested_by, a.action, a.target_type, a.target_id, a.summary, a.diff, a.session_id
FROM approval_requests a
WHERE a.status = 'pending'
ORDER BY a.created_at;
COMMENT ON VIEW v_pending_approvals IS 'Human-in-the-loop queue: agent proposals waiting for John.';

CREATE OR REPLACE VIEW v_repo_tracking AS
SELECT
  r.full_name, r.slug, ga.login AS account, r.is_private, r.activation, r.display, r.redaction_policy,
  r.public_alias, r.primary_language, r.pushed_at,
  (SELECT string_agg(p.slug, ', ') FROM project_repos pr JOIN projects p ON p.id = pr.project_id WHERE pr.repo_id = r.id) AS projects,
  (SELECT count(*) FROM activity_events e WHERE e.repo_id = r.id) AS signal_count
FROM repos r
LEFT JOIN github_accounts ga ON ga.id = r.github_account_id
WHERE r.deleted_at IS NULL
ORDER BY r.pushed_at DESC NULLS LAST;
COMMENT ON VIEW v_repo_tracking IS 'Which repos are tracked/shown, which projects they belong to, and how many signals they produced.';

-- ---------------------------------------------------------------------------
-- Helper functions for operating from the SQL editor / MCP.
-- Each writes an audit_log row.
-- ---------------------------------------------------------------------------

-- SELECT portfolio_set_display('project', 'biotech-kg', 'published');
CREATE OR REPLACE FUNCTION portfolio_set_display(p_type entity_type, p_slug text, p_state display_state DEFAULT 'published')
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_table text;
  v_has_published boolean;
  v_id uuid;
BEGIN
  v_table := CASE p_type
    WHEN 'project' THEN 'projects' WHEN 'post' THEN 'posts' WHEN 'favorite' THEN 'favorites'
    WHEN 'timeline_node' THEN 'timeline_nodes' WHEN 'timeline' THEN 'timelines' WHEN 'deployment' THEN 'deployments'
    WHEN 'repo' THEN 'repos' WHEN 'book' THEN 'books' WHEN 'library_zone' THEN 'library_zones'
  END;
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'portfolio_set_display: unsupported entity type %', p_type;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = v_table AND column_name = 'published_at'
  ) INTO v_has_published;
  IF v_has_published AND p_state IN ('published', 'featured') THEN
    EXECUTE format('UPDATE %I SET display = $1, published_at = COALESCE(published_at, now()) WHERE slug = $2 RETURNING id', v_table)
      INTO v_id USING p_state, p_slug;
  ELSE
    EXECUTE format('UPDATE %I SET display = $1 WHERE slug = $2 RETURNING id', v_table)
      INTO v_id USING p_state, p_slug;
  END IF;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'portfolio_set_display: no % with slug %', p_type, p_slug;
  END IF;
  INSERT INTO audit_log (id, actor, action, entity_type, entity_id, detail)
  VALUES (gen_random_uuid(), 'sql', 'set_display', p_type, v_id::text, json_build_object('display', p_state, 'slug', p_slug));
  RETURN v_id;
END;
$$;
COMMENT ON FUNCTION portfolio_set_display(entity_type, text, display_state) IS 'Set display (hidden/unlisted/published/featured) on any displayable row by slug; stamps published_at; audits.';

-- SELECT portfolio_place_on_shelf('stacks-agents', 'project', '<uuid>', 3);
CREATE OR REPLACE FUNCTION portfolio_place_on_shelf(p_shelf_slug text, p_type entity_type, p_entity_id uuid, p_position int)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_shelf uuid;
  v_id uuid;
BEGIN
  SELECT id INTO v_shelf FROM shelves WHERE slug = p_shelf_slug;
  IF v_shelf IS NULL THEN
    RAISE EXCEPTION 'portfolio_place_on_shelf: no shelf %', p_shelf_slug;
  END IF;
  INSERT INTO shelf_slots (id, shelf_id, position, entity_type, entity_id)
  VALUES (gen_random_uuid(), v_shelf, p_position, p_type, p_entity_id)
  ON CONFLICT (shelf_id, position) DO UPDATE SET entity_type = EXCLUDED.entity_type, entity_id = EXCLUDED.entity_id
  RETURNING id INTO v_id;
  INSERT INTO audit_log (id, actor, action, entity_type, entity_id, detail)
  VALUES (gen_random_uuid(), 'sql', 'place_on_shelf', p_type, p_entity_id::text, json_build_object('shelf', p_shelf_slug, 'position', p_position));
  RETURN v_id;
END;
$$;
COMMENT ON FUNCTION portfolio_place_on_shelf(text, entity_type, uuid, int) IS 'Put an entity into a shelf position (replaces whatever was there); audits.';

-- SELECT portfolio_promote_signal('<activity_event uuid>');  -> new hidden moment built from that signal
CREATE OR REPLACE FUNCTION portfolio_promote_signal(p_event_id uuid, p_stage text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  e activity_events%ROWTYPE;
  v_node uuid := gen_random_uuid();
BEGIN
  SELECT * INTO e FROM activity_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'portfolio_promote_signal: no signal %', p_event_id;
  END IF;
  INSERT INTO timeline_nodes (id, slug, title, summary, occurred_at, kind, stage_code, project_id, display, updated_at)
  VALUES (v_node, 'moment-' || left(v_node::text, 8), e.title, e.summary, e.occurred_at,
          CASE WHEN e.type_code LIKE '%release%' THEN 'release'::timeline_node_kind ELSE 'progress'::timeline_node_kind END,
          p_stage, e.project_id, 'hidden', now());
  INSERT INTO timeline_node_signals (node_id, event_id) VALUES (v_node, p_event_id);
  INSERT INTO audit_log (id, actor, action, entity_type, entity_id, detail)
  VALUES (gen_random_uuid(), 'sql', 'promote_signal', 'timeline_node', v_node::text, json_build_object('event_id', p_event_id));
  RETURN v_node;
END;
$$;
COMMENT ON FUNCTION portfolio_promote_signal(uuid, text) IS 'Create a hidden draft moment from one signal and link it as evidence.';
