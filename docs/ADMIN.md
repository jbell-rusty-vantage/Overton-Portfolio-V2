# Admin console (`/admin`)

John's private control room for the portfolio. Single admin account; every write is audited (`audit_log`),
content changes are versioned (`revisions`), and timeline-worthy changes emit signals (`activity_events`).

## Signing in

- `/admin/login` → email + password. The bootstrap account (`must_change_password = true`) is forced to
  `/admin/account` until a new password (12+ characters) is set.
- Sessions: 14 days, stored in `admin_sessions`. "Sign out everywhere" on the Account page deletes them all.

## Sections

| Section | Route | What you can do |
| --- | --- | --- |
| Dashboard | `/admin` | Counts per area, latest signals, audit trail |
| GitHub repos | `/admin/repos` | Add GitHub accounts (personal / client / org) · **Sync repos** from the GitHub API (new repos arrive `inactive` + `hidden`) · per repo: activation, display, redaction policy, public alias, notes · quick "Track + show" / "Hide" · assign to projects with a role · filter by account/state, search |
| Live sites | `/admin/sites` | Add deployed sites, link to a project, display/activation, sort order · **Run health check** (status, latency, detects whether the site may be iframed) |
| Projects | `/admin/projects`, `/admin/projects/[id]` | Create/edit projects (status, stage, client, dates, tags, featured rank, display/activation) · link repos (role, primary) and live sites · links · cover image from Media · `body_blocks` JSON (component blocks) · clients with public aliases · first publish emits `system.project_published` |
| Media & artifacts | `/admin/media` | Drag-and-drop uploads straight to Vercel Blob (presigned, up to 1 GB, multipart over 50 MB) with purpose (general, project-screenshot, demo-video, diagram, book-texture, scene-asset, blog-image, document) and alt text · register embeds (YouTube, Loom, a deployed site, external) · filter/search · edit metadata · attach to projects with a media role · delete (removes the blob) |
| Blog posts | `/admin/posts`, `/admin/posts/[id]` | Upload `.mdx` (or paste) + the images it references; local image paths are uploaded to Blob and rewritten · frontmatter drives title/slug/excerpt/tags/series/projects/display/date/canonicalUrl/cover · re-uploading identical MDX is a no-op · edit MDX in place · download MDX · quick display change · first publish emits `system.post_published` (NEW BLOG POST) |
| Events & signals | `/admin/events` | **Post custom events** (custom, now-building, milestone, status) with visibility, project, expiry presets, scene effect, JSON payload · browse/filter all signals · change visibility / expire · **Promote to moment** (adds to the global + project timelines) |
| Moments | `/admin/events/moments` | Hand-write timeline moments (date precision, kind, stage, project, importance) and place them on timelines (global, evolution, …) |
| Favorites | `/admin/favorites` | Per category (books, courses, articles, AI tools, software tools, supplements, longevity devices, lab tests): rating, status, dates, summary, links, tags, display, and **category-specific attributes** generated from `favorite_categories.attribute_schema` |
| Account | `/admin/account` | Change password, edit name/email, sign out everywhere |

## MDX frontmatter reference

```yaml
---
title: Building the Library          # else the first "# " heading
slug: building-the-library           # else slugified title
excerpt: How the portfolio became a 3D library
tags: [nextjs, prisma, 3d]
series: library-build-log            # created if missing
projects: [the-library]              # project slugs (unknown slugs are reported)
display: published                   # hidden | unlisted | published | featured (default hidden for new posts)
date: 2026-10-08                     # published_at (future = scheduled)
canonicalUrl: https://…
cover: ./cover.png                   # local file (upload it alongside) or a URL
---
```

## Behaviour worth knowing

- **Frontmatter wins**: a quick display change in the list isn't written back into the MDX; re-uploading MDX with
  `display:` overrides it.
- **Scheduled posts**: a future `date` keeps the post invisible until then, but the NEW BLOG POST signal is only
  emitted on upload/display change. A cron that emits signals for newly-due posts is a TODO.
- **Large media** should go through Media (presigned, no size limit issues). MDX uploads are capped at ~4.5 MB per
  request by Vercel.
- **Signals are append-only**: only visibility and expiry can change.
- **GitHub sync** without `GITHUB_TOKEN` only sees public repos (60 req/h). Private client repos need a token that
  belongs to (or is a member of) that account/org. Sync runs inline in the Server Action.

## Not built yet (next admin work)

- Approval queue UI for agent proposals (`approval_requests`, `v_pending_approvals`).
- Library placement editor (zones → shelves → slots; SQL helper `portfolio_place_on_shelf` exists).
- Books & pages editor (`books`, `book_pages`), computer screen config (`computer_screens`).
- Skills editor + skill levels on moments; stages editor (reflection, date ranges).
- Agent conversation viewer (`agent_sessions`/`agent_messages`).
- GitHub/Vercel webhook receivers → `webhook_deliveries` → `activity_events`.
- Analytics view (`analytics_events`).
- Client edit/delete (create only today).
