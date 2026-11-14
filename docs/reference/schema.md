# Generated Prisma schema reference

Source: [schema.prisma](../../prisma/schema.prisma). Regenerate with `node scripts/schema-reference.mjs`. This reference describes structure, not publication or migration policy.

## AdminUser

People allowed into /admin. One row today (John). Passwords are scrypt hashes.


```prisma
model AdminUser {
  id                 String         @id @default(uuid()) @db.Uuid
  /// Login identifier.
  email              String         @unique
  name               String
  /// scrypt$N$r$p$saltB64$hashB64 — never store plaintext.
  passwordHash       String         @map("password_hash")
  /// Forces a password change on next login (set for the bootstrap account).
  mustChangePassword Boolean        @default(false) @map("must_change_password")
  lastLoginAt        DateTime?      @map("last_login_at") @db.Timestamptz(6)
  createdAt          DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  sessions           AdminSession[]

  @@map("admin_users")
}
```

## AdminSession

Login sessions. The cookie holds a random token; only its SHA-256 is stored here.


```prisma
model AdminSession {
  id         String    @id @default(uuid()) @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  /// sha256(hex) of the session cookie token.
  tokenHash  String    @unique @map("token_hash")
  expiresAt  DateTime  @map("expires_at") @db.Timestamptz(6)
  lastSeenAt DateTime  @default(now()) @map("last_seen_at") @db.Timestamptz(6)
  userAgent  String?   @map("user_agent")
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  user       AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("admin_sessions")
}
```

## Stage

Evolution stages for the Novice -> Production timeline (e.g. novice, builder, full_stack, systems_data, ai_agent_mastery, production_grade).


```prisma
model Stage {
  code        String         @id
  label       String
  description String?
  /// Rich reflection for the stage, stored as component blocks [{component, props}].
  reflection  Json           @default("[]")
  approxStart DateTime?      @map("approx_start") @db.Date
  approxEnd   DateTime?      @map("approx_end") @db.Date
  sortOrder   Int            @default(0) @map("sort_order")
  meta        Json           @default("{}")
  projects    Project[]
  nodes       TimelineNode[]

  @@map("stages")
}
```

## SignalType

Signal types (github.push, github.release, admin.custom, system.post_published, ...).


```prisma
model SignalType {
  code            String          @id
  label           String
  source          SignalSource
  description     String?
  /// Shown in the public live feed by default when the source row is public.
  publicByDefault Boolean         @default(false) @map("public_by_default")
  sortOrder       Int             @default(0) @map("sort_order")
  meta            Json            @default("{}")
  events          ActivityEvent[]

  @@map("lk_signal_types")
}
```

## MediaRole

Why a media asset is attached to something (cover, gallery, screenshot, demo, page_texture, ...).


```prisma
model MediaRole {
  code        String      @id
  label       String
  description String?
  sortOrder   Int         @default(0) @map("sort_order")
  links       MediaLink[]

  @@map("lk_media_roles")
}
```

## SkillCategory

Skill groupings (language, framework, data, ai, infra, practice, ...).


```prisma
model SkillCategory {
  code        String  @id
  label       String
  description String?
  sortOrder   Int     @default(0) @map("sort_order")
  skills      Skill[]

  @@map("lk_skill_categories")
}
```

## LibraryZoneKind

Kinds of library zones (stacks, reading_room, periodicals, computer_station, archive, favorites_wing).


```prisma
model LibraryZoneKind {
  code        String        @id
  label       String
  description String?
  sortOrder   Int           @default(0) @map("sort_order")
  zones       LibraryZone[]

  @@map("lk_library_zone_kinds")
}
```

## FavoriteCategory

Favorite categories. attribute_schema documents the shape of favorites.attributes for that category.


```prisma
model FavoriteCategory {
  code            String     @id
  label           String
  description     String?
  /// JSON-schema-ish description of category-specific attributes (dose, model, markers, ...).
  attributeSchema Json       @default("{}") @map("attribute_schema")
  sortOrder       Int        @default(0) @map("sort_order")
  favorites       Favorite[]

  @@map("favorite_categories")
}
```

## GithubAccount

GitHub accounts whose repos we can ingest (John has a personal and a client account).


```prisma
model GithubAccount {
  id           String    @id @default(uuid()) @db.Uuid
  login        String    @unique
  label        String?
  /// personal | client | org
  kind         String    @default("personal")
  avatarUrl    String?   @map("avatar_url")
  htmlUrl      String?   @map("html_url")
  notes        String?
  lastSyncedAt DateTime? @map("last_synced_at") @db.Timestamptz(6)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  repos        Repo[]

  @@map("github_accounts")
}
```

## Repo

Every GitHub repo we know about. Sync adds rows as inactive+hidden; John chooses what is tracked and shown.


```prisma
model Repo {
  id              String          @id @default(uuid()) @db.Uuid
  slug            String          @unique
  githubAccountId String?         @map("github_account_id") @db.Uuid
  /// GitHub's numeric repo id (stable across renames).
  githubId        BigInt?         @unique @map("github_id")
  /// owner/name
  fullName        String          @unique @map("full_name")
  name            String
  description     String?
  htmlUrl         String?         @map("html_url")
  homepageUrl     String?         @map("homepage_url")
  isPrivate       Boolean         @default(false) @map("is_private")
  isFork          Boolean         @default(false) @map("is_fork")
  isArchived      Boolean         @default(false) @map("is_archived")
  defaultBranch   String?         @map("default_branch")
  primaryLanguage String?         @map("primary_language")
  topics          String[]        @default([])
  stars           Int             @default(0)
  forks           Int             @default(0)
  pushedAt        DateTime?       @map("pushed_at") @db.Timestamptz(6)
  githubCreatedAt DateTime?       @map("github_created_at") @db.Timestamptz(6)
  activation      ActivationState @default(inactive)
  display         DisplayState    @default(hidden)
  redactionPolicy RedactionPolicy @default(none) @map("redaction_policy")
  /// Name shown publicly instead of full_name (e.g. for client work).
  publicAlias     String?         @map("public_alias")
  notes           String?
  lastSyncedAt    DateTime?       @map("last_synced_at") @db.Timestamptz(6)
  createdAt       DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?       @map("deleted_at") @db.Timestamptz(6)
  githubAccount   GithubAccount?  @relation(fields: [githubAccountId], references: [id], onDelete: SetNull)
  projects        ProjectRepo[]
  events          ActivityEvent[]

  @@index([activation, display])
  @@map("repos")
}
```

## Client

Organizations work was done for. public_alias hides the real name when show_name = false.


```prisma
model Client {
  id          String    @id @default(uuid()) @db.Uuid
  slug        String    @unique
  name        String
  publicAlias String?   @map("public_alias")
  showName    Boolean   @default(false) @map("show_name")
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  projects    Project[]

  @@map("clients")
}
```

## Deployment

Live deployed sites (shown on the library's computer station).


```prisma
model Deployment {
  id                String              @id @default(uuid()) @db.Uuid
  slug              String              @unique
  title             String
  url               String              @unique
  description       String?
  /// vercel | netlify | aws | other
  provider          String              @default("vercel")
  vercelProjectId   String?             @map("vercel_project_id")
  environment       String              @default("production")
  /// Whether the site allows being framed (X-Frame-Options / CSP frame-ancestors).
  iframeAllowed     Boolean             @default(false) @map("iframe_allowed")
  /// URL pinged by health checks (defaults to url).
  healthCheckUrl    String?             @map("health_check_url")
  lastStatusCode    Int?                @map("last_status_code")
  lastStatusOk      Boolean?            @map("last_status_ok")
  lastLatencyMs     Int?                @map("last_latency_ms")
  lastCheckedAt     DateTime?           @map("last_checked_at") @db.Timestamptz(6)
  screenshotMediaId String?             @map("screenshot_media_id") @db.Uuid
  activation        ActivationState     @default(tracking)
  display           DisplayState        @default(hidden)
  sortOrder         Int                 @default(0) @map("sort_order")
  createdAt         DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt         DateTime?           @map("deleted_at") @db.Timestamptz(6)
  screenshot        MediaAsset?         @relation("DeploymentScreenshot", fields: [screenshotMediaId], references: [id], onDelete: SetNull)
  projects          ProjectDeployment[]
  events            ActivityEvent[]
  screens           ComputerScreen[]

  @@map("deployments")
}
```

## Project

The core unit of the portfolio. Many repos, many deployments, its own timeline.


```prisma
model Project {
  id           String              @id @default(uuid()) @db.Uuid
  slug         String              @unique
  title        String
  tagline      String?
  summary      String?
  /// Case-study body as component blocks [{component, props}] rendered by the shared registry.
  bodyBlocks   Json                @default("[]") @map("body_blocks")
  status       ProjectStatus       @default(active)
  startedOn    DateTime?           @map("started_on") @db.Date
  endedOn      DateTime?           @map("ended_on") @db.Date
  clientId     String?             @map("client_id") @db.Uuid
  coverMediaId String?             @map("cover_media_id") @db.Uuid
  stageCode    String?             @map("stage_code")
  tags         String[]            @default([])
  /// Lower = earlier in featured lists; null = not featured-ordered.
  featuredRank Int?                @map("featured_rank")
  sortOrder    Int                 @default(0) @map("sort_order")
  activation   ActivationState     @default(tracking)
  display      DisplayState        @default(hidden)
  publishedAt  DateTime?           @map("published_at") @db.Timestamptz(6)
  createdAt    DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt    DateTime?           @map("deleted_at") @db.Timestamptz(6)
  client       Client?             @relation(fields: [clientId], references: [id], onDelete: SetNull)
  cover        MediaAsset?         @relation("ProjectCover", fields: [coverMediaId], references: [id], onDelete: SetNull)
  stage        Stage?              @relation(fields: [stageCode], references: [code], onDelete: SetNull)
  repos        ProjectRepo[]
  deployments  ProjectDeployment[]
  links        ProjectLink[]
  skills       ProjectSkill[]
  posts        PostProject[]
  events       ActivityEvent[]
  nodes        TimelineNode[]
  timelines    Timeline[]

  @@index([display])
  @@map("projects")
}
```

## ProjectRepo

Projects <-> repos (many-to-many) with the repo's role in the project.


```prisma
model ProjectRepo {
  projectId String  @map("project_id") @db.Uuid
  repoId    String  @map("repo_id") @db.Uuid
  /// frontend | api | infra | agent | data | docs | other
  role      String  @default("other")
  isPrimary Boolean @default(false) @map("is_primary")
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  repo      Repo    @relation(fields: [repoId], references: [id], onDelete: Cascade)

  @@id([projectId, repoId])
  @@map("project_repos")
}
```

## ProjectDeployment

Projects <-> deployments (many-to-many).


```prisma
model ProjectDeployment {
  projectId    String     @map("project_id") @db.Uuid
  deploymentId String     @map("deployment_id") @db.Uuid
  role         String     @default("app")
  isPrimary    Boolean    @default(false) @map("is_primary")
  project      Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  deployment   Deployment @relation(fields: [deploymentId], references: [id], onDelete: Cascade)

  @@id([projectId, deploymentId])
  @@map("project_deployments")
}
```

## ProjectLink

Extra links for a project (docs, demo video, article, figma...).


```prisma
model ProjectLink {
  id        String  @id @default(uuid()) @db.Uuid
  projectId String  @map("project_id") @db.Uuid
  kind      String  @default("link")
  label     String
  url       String
  sortOrder Int     @default(0) @map("sort_order")
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("project_links")
}
```

## PostSeries

Named series grouping related posts.


```prisma
model PostSeries {
  id          String  @id @default(uuid()) @db.Uuid
  slug        String  @unique
  title       String
  description String?
  posts       Post[]

  @@map("post_series")
}
```

## Post

Blog posts/articles. mdx_source is canonical; columns are derived from frontmatter on upload.


```prisma
model Post {
  id             String             @id @default(uuid()) @db.Uuid
  slug           String             @unique
  title          String
  excerpt        String?
  /// Raw MDX (after local image paths are rewritten to Blob URLs).
  mdxSource      String             @map("mdx_source")
  /// Parsed frontmatter as uploaded.
  frontmatter    Json               @default("{}")
  /// sha256 of the uploaded MDX; re-uploads with the same hash are no-ops.
  sourceHash     String?            @map("source_hash")
  readingMinutes Int?               @map("reading_minutes")
  seriesId       String?            @map("series_id") @db.Uuid
  canonicalUrl   String?            @map("canonical_url")
  coverMediaId   String?            @map("cover_media_id") @db.Uuid
  tags           String[]           @default([])
  display        DisplayState       @default(hidden)
  /// Scheduled/actual publish time. Visitors see the post only when display >= published AND published_at <= now().
  publishedAt    DateTime?          @map("published_at") @db.Timestamptz(6)
  createdAt      DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?          @map("deleted_at") @db.Timestamptz(6)
  series         PostSeries?        @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  cover          MediaAsset?        @relation("PostCover", fields: [coverMediaId], references: [id], onDelete: SetNull)
  projects       PostProject[]
  nodes          PostTimelineNode[]
  assets         PostAsset[]
  events         ActivityEvent[]

  @@index([display, publishedAt])
  @@map("posts")
}
```

## PostProject

Posts <-> projects they discuss.


```prisma
model PostProject {
  postId    String  @map("post_id") @db.Uuid
  projectId String  @map("project_id") @db.Uuid
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@id([postId, projectId])
  @@map("post_projects")
}
```

## PostTimelineNode

Posts <-> moments they explain (e.g. a post about a milestone).


```prisma
model PostTimelineNode {
  postId String       @map("post_id") @db.Uuid
  nodeId String       @map("node_id") @db.Uuid
  post   Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  node   TimelineNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@id([postId, nodeId])
  @@map("post_timeline_nodes")
}
```

## PostAsset

Map of local image paths in uploaded MDX (./diagram.png) to the Blob media they were rewritten to.


```prisma
model PostAsset {
  id           String     @id @default(uuid()) @db.Uuid
  postId       String     @map("post_id") @db.Uuid
  originalPath String     @map("original_path")
  mediaId      String     @map("media_id") @db.Uuid
  post         Post       @relation(fields: [postId], references: [id], onDelete: Cascade)
  media        MediaAsset @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@unique([postId, originalPath])
  @@map("post_assets")
}
```

## ActivityEvent

SIGNALS: append-only raw facts (GitHub/Vercel webhooks, admin custom events, system events). Never edited.


```prisma
model ActivityEvent {
  id           String               @id @default(uuid()) @db.Uuid
  occurredAt   DateTime             @map("occurred_at") @db.Timestamptz(6)
  source       SignalSource
  typeCode     String               @map("type_code")
  repoId       String?              @map("repo_id") @db.Uuid
  deploymentId String?              @map("deployment_id") @db.Uuid
  projectId    String?              @map("project_id") @db.Uuid
  postId       String?              @map("post_id") @db.Uuid
  /// GitHub login, "john", "admin-agent", ...
  actor        String?
  title        String
  summary      String?
  url          String?
  /// Full normalized payload from the source.
  payload      Json                 @default("{}")
  visibility   SignalVisibility     @default(private)
  /// Idempotency key, e.g. gh:push:<sha>. Duplicate deliveries are ignored.
  dedupeKey    String?              @unique @map("dedupe_key")
  /// Custom events can expire (e.g. a "Now building X" banner).
  expiresAt    DateTime?            @map("expires_at") @db.Timestamptz(6)
  /// Optional named effect for the 3D scene (e.g. glow_shelf, ring_bell).
  sceneEffect  String?              @map("scene_effect")
  /// True when imported by a history backfill rather than a live webhook.
  backfilled   Boolean              @default(false)
  createdAt    DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  type         SignalType           @relation(fields: [typeCode], references: [code])
  repo         Repo?                @relation(fields: [repoId], references: [id], onDelete: SetNull)
  deployment   Deployment?          @relation(fields: [deploymentId], references: [id], onDelete: SetNull)
  project      Project?             @relation(fields: [projectId], references: [id], onDelete: SetNull)
  post         Post?                @relation(fields: [postId], references: [id], onDelete: SetNull)
  nodes        TimelineNodeSignal[]

  @@index([occurredAt(sort: Desc)])
  @@index([repoId, occurredAt(sort: Desc)])
  @@index([projectId, occurredAt(sort: Desc)])
  @@index([visibility, occurredAt(sort: Desc)])
  @@map("activity_events")
}
```

## TimelineNode

MOMENTS: curated story points. One signal, a group of signals, or none (hand-written). Progress updates are moments.


```prisma
model TimelineNode {
  id            String               @id @default(uuid()) @db.Uuid
  slug          String               @unique
  title         String
  summary       String?
  bodyBlocks    Json                 @default("[]") @map("body_blocks")
  occurredAt    DateTime             @map("occurred_at") @db.Timestamptz(6)
  /// End of a span (e.g. "spring 2023 bootcamp"); null for a point in time.
  occurredUntil DateTime?            @map("occurred_until") @db.Timestamptz(6)
  precision     DatePrecision        @default(day)
  kind          TimelineNodeKind     @default(milestone)
  stageCode     String?              @map("stage_code")
  projectId     String?              @map("project_id") @db.Uuid
  /// 1 (minor) .. 5 (defining moment).
  importance    Int                  @default(3)
  display       DisplayState         @default(hidden)
  publishedAt   DateTime?            @map("published_at") @db.Timestamptz(6)
  createdAt     DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt     DateTime?            @map("deleted_at") @db.Timestamptz(6)
  stage         Stage?               @relation(fields: [stageCode], references: [code], onDelete: SetNull)
  project       Project?             @relation(fields: [projectId], references: [id], onDelete: SetNull)
  signals       TimelineNodeSignal[]
  memberships   TimelineMembership[]
  skills        NodeSkill[]
  posts         PostTimelineNode[]

  @@index([occurredAt])
  @@index([projectId, occurredAt])
  @@map("timeline_nodes")
}
```

## TimelineNodeSignal

Evidence: which signals a moment was built from.


```prisma
model TimelineNodeSignal {
  nodeId  String        @map("node_id") @db.Uuid
  eventId String        @map("event_id") @db.Uuid
  node    TimelineNode  @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  event   ActivityEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@id([nodeId, eventId])
  @@map("timeline_node_signals")
}
```

## Timeline

TIMELINES: named ordered sets of moments (global, one per project, the evolution story, custom).


```prisma
model Timeline {
  id          String               @id @default(uuid()) @db.Uuid
  slug        String               @unique
  kind        TimelineKind
  projectId   String?              @map("project_id") @db.Uuid
  title       String
  description String?
  display     DisplayState         @default(hidden)
  createdAt   DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)
  project     Project?             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  memberships TimelineMembership[]

  @@map("timelines")
}
```

## TimelineMembership

Moment <-> timeline placement. A moment can appear on several timelines.


```prisma
model TimelineMembership {
  timelineId   String       @map("timeline_id") @db.Uuid
  nodeId       String       @map("node_id") @db.Uuid
  position     Int          @default(0)
  chapterLabel String?      @map("chapter_label")
  timeline     Timeline     @relation(fields: [timelineId], references: [id], onDelete: Cascade)
  node         TimelineNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@id([timelineId, nodeId])
  @@index([timelineId, position])
  @@map("timeline_memberships")
}
```

## Skill

Skills/technologies (TypeScript, Postgres, agent orchestration...) linked to moments and projects.


```prisma
model Skill {
  id           String         @id @default(uuid()) @db.Uuid
  slug         String         @unique
  name         String
  categoryCode String?        @map("category_code")
  description  String?
  iconUrl      String?        @map("icon_url")
  category     SkillCategory? @relation(fields: [categoryCode], references: [code], onDelete: SetNull)
  nodes        NodeSkill[]
  projects     ProjectSkill[]

  @@map("skills")
}
```

## NodeSkill

Skill demonstrated at a moment, with the level (1-5) reached then — powers skill-growth charts.


```prisma
model NodeSkill {
  nodeId  String       @map("node_id") @db.Uuid
  skillId String       @map("skill_id") @db.Uuid
  level   Int?
  node    TimelineNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  skill   Skill        @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([nodeId, skillId])
  @@map("node_skills")
}
```

## ProjectSkill

Skills a project demonstrates, with optional level 1-5.


```prisma
model ProjectSkill {
  projectId String  @map("project_id") @db.Uuid
  skillId   String  @map("skill_id") @db.Uuid
  level     Int?
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  skill     Skill   @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([projectId, skillId])
  @@map("project_skills")
}
```

## MediaAsset

Any file or embed: images, videos (blob/youtube/loom/deployment), audio, GLB models, documents.


```prisma
model MediaAsset {
  id              String           @id @default(uuid()) @db.Uuid
  kind            MediaKind
  provider        MediaProvider    @default(blob)
  /// Public URL (Blob CDN URL, YouTube/Loom URL, or external URL).
  url             String
  /// Pathname inside the Blob store (null for embeds). Needed to delete the blob.
  blobPathname    String?          @map("blob_pathname")
  mimeType        String?          @map("mime_type")
  bytes           BigInt?
  width           Int?
  height          Int?
  durationS       Float?           @map("duration_s")
  /// Tiny base64 placeholder for progressive image loading.
  blurDataUrl     String?          @map("blur_data_url")
  posterMediaId   String?          @map("poster_media_id") @db.Uuid
  title           String?
  alt             String?
  caption         String?
  /// Free-text intent at upload time (hero, book-texture, scene-asset, ...).
  purpose         String?
  tags            String[]         @default([])
  checksum        String?
  createdAt       DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt       DateTime?        @map("deleted_at") @db.Timestamptz(6)
  poster          MediaAsset?      @relation("MediaPoster", fields: [posterMediaId], references: [id], onDelete: SetNull)
  posterOf        MediaAsset[]     @relation("MediaPoster")
  links           MediaLink[]
  postAssets      PostAsset[]
  projectCovers   Project[]        @relation("ProjectCover")
  postCovers      Post[]           @relation("PostCover")
  favoriteCovers  Favorite[]       @relation("FavoriteCover")
  bookCovers      Book[]           @relation("BookCover")
  deploymentShots Deployment[]     @relation("DeploymentScreenshot")
  screens         ComputerScreen[]
  sceneAssets     SceneAsset[]

  @@index([kind, createdAt(sort: Desc)])
  @@map("media_assets")
}
```

## MediaLink

Attach media to anything (polymorphic: entity_type + entity_id) for a role, in order.


```prisma
model MediaLink {
  id         String     @id @default(uuid()) @db.Uuid
  mediaId    String     @map("media_id") @db.Uuid
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id") @db.Uuid
  roleCode   String     @default("gallery") @map("role_code")
  position   Int        @default(0)
  caption    String?
  createdAt  DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  media      MediaAsset @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  role       MediaRole  @relation(fields: [roleCode], references: [code])

  @@unique([mediaId, entityType, entityId, roleCode])
  @@index([entityType, entityId, roleCode, position])
  @@map("media_links")
}
```

## LinkPreview

Cached OpenGraph/embed previews for external links.


```prisma
model LinkPreview {
  id          String   @id @default(uuid()) @db.Uuid
  url         String   @unique
  title       String?
  description String?
  imageUrl    String?  @map("image_url")
  siteName    String?  @map("site_name")
  fetchedAt   DateTime @default(now()) @map("fetched_at") @db.Timestamptz(6)

  @@map("link_previews")
}
```

## Favorite

A favorite (book, supplement, device, lab test, AI tool, software tool, course, article...) with context.


```prisma
model Favorite {
  id           String             @id @default(uuid()) @db.Uuid
  slug         String             @unique
  categoryCode String             @map("category_code")
  title        String
  /// Author, brand, maker, vendor...
  creator      String?
  url          String?
  affiliateUrl String?            @map("affiliate_url")
  /// 1..5
  rating       Int?
  status       FavoriteStatus     @default(current)
  startedOn    DateTime?          @map("started_on") @db.Date
  endedOn      DateTime?          @map("ended_on") @db.Date
  summary      String?
  /// "Why it's a favorite" as component blocks.
  whyBlocks    Json               @default("[]") @map("why_blocks")
  /// Category-specific attributes (see favorite_categories.attribute_schema).
  attributes   Json               @default("{}")
  coverMediaId String?            @map("cover_media_id") @db.Uuid
  tags         String[]           @default([])
  sortOrder    Int                @default(0) @map("sort_order")
  display      DisplayState       @default(hidden)
  publishedAt  DateTime?          @map("published_at") @db.Timestamptz(6)
  createdAt    DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt    DateTime?          @map("deleted_at") @db.Timestamptz(6)
  category     FavoriteCategory   @relation(fields: [categoryCode], references: [code])
  cover        MediaAsset?        @relation("FavoriteCover", fields: [coverMediaId], references: [id], onDelete: SetNull)
  relations    FavoriteRelation[]

  @@index([categoryCode, sortOrder])
  @@map("favorites")
}
```

## FavoriteRelation

Contextual links from a favorite to a project/post/moment ("this book shaped X").


```prisma
model FavoriteRelation {
  id         String     @id @default(uuid()) @db.Uuid
  favoriteId String     @map("favorite_id") @db.Uuid
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id") @db.Uuid
  note       String?
  favorite   Favorite   @relation(fields: [favoriteId], references: [id], onDelete: Cascade)

  @@unique([favoriteId, entityType, entityId])
  @@map("favorite_relations")
}
```

## LibraryZone

Areas of the library (stacks, reading room, periodicals rack, computer station, archive...).


```prisma
model LibraryZone {
  id            String          @id @default(uuid()) @db.Uuid
  slug          String          @unique
  kindCode      String          @map("kind_code")
  title         String
  description   String?
  /// Name of the object/empty in the Blender/GLB scene this zone maps to.
  sceneNodeName String?         @map("scene_node_name")
  /// Camera position/target/fov for "go to zone".
  cameraPreset  Json            @default("{}") @map("camera_preset")
  sortOrder     Int             @default(0) @map("sort_order")
  display       DisplayState    @default(published)
  kind          LibraryZoneKind @relation(fields: [kindCode], references: [code])
  shelves       Shelf[]

  @@map("library_zones")
}
```

## Shelf

A bookshelf inside a library zone; slots hold what sits on it.


```prisma
model Shelf {
  id            String      @id @default(uuid()) @db.Uuid
  slug          String      @unique
  zoneId        String      @map("zone_id") @db.Uuid
  title         String
  theme         String?
  sceneNodeName String?     @map("scene_node_name")
  capacity      Int         @default(24)
  sortOrder     Int         @default(0) @map("sort_order")
  zone          LibraryZone @relation(fields: [zoneId], references: [id], onDelete: Cascade)
  slots         ShelfSlot[]

  @@map("shelves")
}
```

## ShelfSlot

What sits where on a shelf (polymorphic: usually a book, project, post or favorite).


```prisma
model ShelfSlot {
  id         String     @id @default(uuid()) @db.Uuid
  shelfId    String     @map("shelf_id") @db.Uuid
  position   Int
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id") @db.Uuid
  /// Spine color/height/label overrides for the 3D book.
  spineStyle Json       @default("{}") @map("spine_style")
  shelf      Shelf      @relation(fields: [shelfId], references: [id], onDelete: Cascade)

  @@unique([shelfId, position])
  @@index([entityType, entityId])
  @@map("shelf_slots")
}
```

## Book

A book that opens in the 3D library. Usually wraps a project/post/favorite; curated books have no entity.


```prisma
model Book {
  id           String       @id @default(uuid()) @db.Uuid
  slug         String       @unique
  entityType   EntityType?  @map("entity_type")
  entityId     String?      @map("entity_id") @db.Uuid
  title        String
  subtitle     String?
  coverMediaId String?      @map("cover_media_id") @db.Uuid
  pageMode     BookPageMode @default(generated) @map("page_mode")
  display      DisplayState @default(hidden)
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  cover        MediaAsset?  @relation("BookCover", fields: [coverMediaId], references: [id], onDelete: SetNull)
  pages        BookPage[]

  @@index([entityType, entityId])
  @@map("books")
}
```

## BookPage

Ordered pages of a book; blocks are component blocks rendered on the 3D page texture or in 2D.


```prisma
model BookPage {
  id           String   @id @default(uuid()) @db.Uuid
  bookId       String   @map("book_id") @db.Uuid
  position     Int
  /// Page template (cover, overview, architecture, timeline, gallery, code, metrics, links).
  templateCode String?  @map("template_code")
  blocks       Json     @default("[]")
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  book         Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([bookId, position])
  @@map("book_pages")
}
```

## ComputerScreen

What the computer station's screens show.


```prisma
model ComputerScreen {
  id           String      @id @default(uuid()) @db.Uuid
  /// Screen identifier in the scene (main, side, terminal...).
  slot         String      @unique
  mode         ScreenMode  @default(feed)
  deploymentId String?     @map("deployment_id") @db.Uuid
  mediaId      String?     @map("media_id") @db.Uuid
  config       Json        @default("{}")
  updatedAt    DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)
  deployment   Deployment? @relation(fields: [deploymentId], references: [id], onDelete: SetNull)
  media        MediaAsset? @relation(fields: [mediaId], references: [id], onDelete: SetNull)

  @@map("computer_screens")
}
```

## SceneAsset

Versioned 3D assets (GLB scenes, props, textures) stored in Blob.


```prisma
model SceneAsset {
  id        String     @id @default(uuid()) @db.Uuid
  slug      String
  mediaId   String     @map("media_id") @db.Uuid
  version   Int        @default(1)
  isActive  Boolean    @default(false) @map("is_active")
  notes     String?
  createdAt DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  media     MediaAsset @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@unique([slug, version])
  @@map("scene_assets")
}
```

## UiComponent

Mirror of the code-level component registry (Zod prop schemas) so agents/admins can discover components.


```prisma
model UiComponent {
  code            String   @id
  version         Int      @default(1)
  description     String?
  /// JSON Schema of the component's props (generated from Zod).
  propsSchema     Json     @default("{}") @map("props_schema")
  /// Where it may render: mdx, book_page, librarian, admin, project_body.
  allowedContexts String[] @default([]) @map("allowed_contexts")
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("ui_components")
}
```

## UiLayout

Saved compositions of blocks (e.g. a librarian answer worth pinning).


```prisma
model UiLayout {
  id        String   @id @default(uuid()) @db.Uuid
  slug      String   @unique
  title     String
  blocks    Json     @default("[]")
  createdBy String?  @map("created_by")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("ui_layouts")
}
```

## Agent

Agent definitions (librarian, admin).


```prisma
model Agent {
  id                  String         @id @default(uuid()) @db.Uuid
  code                String         @unique
  name                String
  description         String?
  model               String?
  instructionsVersion String?        @map("instructions_version")
  isPublic            Boolean        @default(false) @map("is_public")
  createdAt           DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  sessions            AgentSession[]

  @@map("agents")
}
```

## AgentSession

One conversation. eve_run_id links to the durable eve workflow (needed to resume after approvals).


```prisma
model AgentSession {
  id          String            @id @default(uuid()) @db.Uuid
  agentId     String            @map("agent_id") @db.Uuid
  /// Random anonymous visitor id (cookie) or "admin".
  visitorId   String?           @map("visitor_id")
  eveRunId    String?           @map("eve_run_id")
  title       String?
  summary     String?
  totalTokens Int               @default(0) @map("total_tokens")
  costUsd     Decimal           @default(0) @map("cost_usd") @db.Decimal(10, 4)
  flagged     Boolean           @default(false)
  metadata    Json              @default("{}")
  startedAt   DateTime          @default(now()) @map("started_at") @db.Timestamptz(6)
  endedAt     DateTime?         @map("ended_at") @db.Timestamptz(6)
  agent       Agent             @relation(fields: [agentId], references: [id], onDelete: Cascade)
  messages    AgentMessage[]
  toolCalls   AgentToolCall[]
  approvals   ApprovalRequest[]

  @@index([agentId, startedAt(sort: Desc)])
  @@index([visitorId])
  @@map("agent_sessions")
}
```

## AgentMessage

Each turn, in order. content holds AI SDK message parts (text, tool calls, UI parts).


```prisma
model AgentMessage {
  id        String           @id @default(uuid()) @db.Uuid
  sessionId String           @map("session_id") @db.Uuid
  seq       Int
  role      AgentMessageRole
  content   Json
  tokens    Int?
  createdAt DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  session   AgentSession     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  toolCalls AgentToolCall[]

  @@unique([sessionId, seq])
  @@map("agent_messages")
}
```

## AgentToolCall

Every tool call an agent made (input, output, latency) for audit and debugging.


```prisma
model AgentToolCall {
  id        String        @id @default(uuid()) @db.Uuid
  sessionId String        @map("session_id") @db.Uuid
  messageId String?       @map("message_id") @db.Uuid
  toolName  String        @map("tool_name")
  input     Json          @default("{}")
  output    Json?
  status    String        @default("ok")
  latencyMs Int?          @map("latency_ms")
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  session   AgentSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  message   AgentMessage? @relation(fields: [messageId], references: [id], onDelete: SetNull)

  @@index([sessionId, createdAt])
  @@map("agent_tool_calls")
}
```

## ApprovalRequest

Human-in-the-loop queue: publish/delete/visitor-visible changes proposed by agents wait here for John.


```prisma
model ApprovalRequest {
  id           String         @id @default(uuid()) @db.Uuid
  sessionId    String?        @map("session_id") @db.Uuid
  /// admin-agent, mcp, claude-code, ...
  requestedBy  String         @map("requested_by")
  /// publish | unpublish | delete | update_public | ...
  action       String
  targetType   EntityType?    @map("target_type")
  targetId     String?        @map("target_id") @db.Uuid
  summary      String
  /// Proposed change (before/after or patch).
  diff         Json           @default("{}")
  status       ApprovalStatus @default(pending)
  decidedAt    DateTime?      @map("decided_at") @db.Timestamptz(6)
  decidedBy    String?        @map("decided_by")
  decisionNote String?        @map("decision_note")
  createdAt    DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  session      AgentSession?  @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([status, createdAt])
  @@map("approval_requests")
}
```

## Revision

Full version history (posts, projects, moments, favorites, pages...). snapshot = the row as JSON after the change.


```prisma
model Revision {
  id         String     @id @default(uuid()) @db.Uuid
  entityType EntityType @map("entity_type")
  entityId   String     @map("entity_id") @db.Uuid
  version    Int
  /// john | admin-agent | mcp | system
  author     String     @default("john")
  message    String?
  snapshot   Json
  createdAt  DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)

  @@unique([entityType, entityId, version])
  @@map("revisions")
}
```

## AuditLog

Every admin/agent write, for accountability.


```prisma
model AuditLog {
  id         String      @id @default(uuid()) @db.Uuid
  actor      String
  action     String
  entityType EntityType? @map("entity_type")
  entityId   String?     @map("entity_id")
  detail     Json        @default("{}")
  at         DateTime    @default(now()) @db.Timestamptz(6)

  @@index([at(sort: Desc)])
  @@map("audit_log")
}
```

## AnalyticsEvent

3D/library-specific analytics (book_opened, shelf_visited, librarian_asked...). No PII: visitor_id is random.


```prisma
model AnalyticsEvent {
  id        String   @id @default(uuid()) @db.Uuid
  visitorId String?  @map("visitor_id")
  sessionId String?  @map("session_id")
  name      String
  path      String?
  props     Json     @default("{}")
  at        DateTime @default(now()) @db.Timestamptz(6)

  @@index([name, at(sort: Desc)])
  @@map("analytics_events")
}
```

## WebhookDelivery

Raw inbound webhooks (GitHub/Vercel) kept for replay, debugging and dedupe.


```prisma
model WebhookDelivery {
  id          String    @id @default(uuid()) @db.Uuid
  source      String
  deliveryId  String    @map("delivery_id")
  eventName   String?   @map("event_name")
  headers     Json      @default("{}")
  body        Json      @default("{}")
  receivedAt  DateTime  @default(now()) @map("received_at") @db.Timestamptz(6)
  processedAt DateTime? @map("processed_at") @db.Timestamptz(6)
  error       String?

  @@unique([source, deliveryId])
  @@map("webhook_deliveries")
}
```

## PortraitLedger

Atomic shared portrait rate and spend ledger; no conversation content.


```prisma
model PortraitLedger {
  /// Singleton ID locked for all reserve and settle transactions.
  id Int @id
  /// Versioned integer micro-dollar reservations and hashed rate buckets.
  state Json
  /// Most recent ledger mutation timestamp.
  updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz(6)
  @@map("portrait_ledger")
}
```
