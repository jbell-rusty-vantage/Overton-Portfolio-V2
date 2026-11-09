# The 3D Library

The local hall, guided cameras, selectable volumes and HTML reader are implemented. For changes, start with [the iteration guide](ITERATING_ON_THE_LIBRARY.md), [the running preview](LOCAL_PREVIEW.md) or [the editable asset workflow](../assets/library/README.md). The original concept and interview questions below are historical design context, including proposed features that are not implemented.

## Concept

Visitors walk into a 3D library. An **AI librarian** (Vercel eve agent) greets them, answers questions using curated
tools, and moves the camera to shelves and books. **Books open into portfolio pages** that visitors page through.
A **computer station** shows live deployed projects, demo videos and the realtime activity feed.

| Zone (`library_zones.slug`) | Holds | Data |
| --- | --- | --- |
| `entrance` | Front desk, the librarian | `agents` (librarian) |
| `stacks` | Project books on themed shelves (AI & Agents, Data & Knowledge Graphs, Web Apps, Client Work) | `projects` → `books` → `book_pages` |
| `evolution-hall` | The Novice → Production journey, stage by stage (incl. AI Agent Mastery) | `timelines` (evolution), `timeline_nodes`, `stages` |
| `periodicals` | Blog posts and articles | `posts` |
| `favorites-wing` | Favorite books as literal 3D books, AI/software tools, supplements, devices, lab tests | `favorites` by `favorite_categories` |
| `reading-room` | Courses, articles, case studies, reports | `favorites` (course, article) |
| `computer-station` | Live sites (iframe/video), activity feed, terminal replaying commits | `computer_screens`, `deployments`, `v_live_feed` |

Default zones and shelves are seeded; placement is editable via `shelf_slots` (admin UI to come;
SQL: `portfolio_place_on_shelf(...)`).

## Recommended stack

- **React Three Fiber** + **drei** (+ **Rapier** if physical interactions are wanted) inside the Next.js app.
- **Blender** for the environment; export **glTF/GLB** with Draco or Meshopt compression
  (`gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp`).
- **Naming contract**: Blender objects/empties are named after `library_zones.scene_node_name` and
  `shelves.scene_node_name` (`zone_stacks`, `shelf_stacks_ai`, …). The app looks those nodes up and fills them with
  data, so the scene and the database stay decoupled.
- **Assets**: the base scene can ship in `/public/scene/` (cached by the CDN). Swappable props/textures live in Blob:
  upload via `/admin/media` with purpose `scene-asset` → register in `scene_assets` (versioned; one `is_active` per
  slug).
- **Book pages**: render `book_pages.blocks` (component blocks) to the page — either HTML via drei `<Html transform>`
  or a canvas texture. Page turns via a bent-plane shader or a pre-animated GLB page.
- **Camera**: `camera_preset` JSON on zones (position, target, fov) for "go to zone"; librarian tool `navigate_to(zone|shelf|book)`
  drives a camera rig (e.g. drei `CameraControls`).
- **2D fallback** (mobile, SEO, reduced motion): the same routes render plain pages from the same data
  (`/projects/[slug]`, `/blog/[slug]`, `/evolution`, `/favorites`).
- **Performance**: lazy-load the canvas (`next/dynamic`, `ssr: false`), progressive LOD, instanced books on shelves,
  KTX2 textures, a `<Suspense>` loader in the scene.

## Realtime in the scene

`activity_events` rows can carry `scene_effect` (`glow_shelf`, `ring_bell`, `open_book`, `flash_screen`). A realtime
channel (SSE + Upstash Redis, or Ably/Pusher — undecided) pushes new public signals; the scene maps them to effects
on the project's shelf/book. The DB already emits `pg_notify('activity_events', …)` on insert.

## The librarian (eve)

- Tools (one TypeScript file each, shared with the portfolio MCP server): `navigate_to`, `open_book`,
  `search_content`, `get_timeline`, `get_project`, `get_recent_activity`, `list_favorites`, `render_component`.
- Generative UI: `render_component` returns `{component, props}` validated against the component registry.
- Every conversation is stored: `agent_sessions`, `agent_messages`, `agent_tool_calls` (`eve_run_id` links to the
  durable eve workflow). Retrieval needs `content_chunks` + pgvector (to add).

## Open questions for the 3D interviews

1. How many zones/shelves in the first layout? Free camera, on-rails, or librarian-guided?
2. Book page templates for v1 (cover, overview, architecture, timeline, gallery, code, metrics, links)?
3. Is the librarian a visible 3D character (avatar + animations) or voice/UI only?
4. Page rendering: HTML-in-3D vs canvas textures (affects interactivity and text crispness).
5. Can visitors leave anything behind (guestbook, saved books)?
6. Realtime transport choice and presence ("N visitors in the library").
