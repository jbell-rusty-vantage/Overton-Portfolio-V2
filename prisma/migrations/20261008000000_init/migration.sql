-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "display_state" AS ENUM ('hidden', 'unlisted', 'published', 'featured');

-- CreateEnum
CREATE TYPE "activation_state" AS ENUM ('inactive', 'tracking', 'paused');

-- CreateEnum
CREATE TYPE "redaction_policy" AS ENUM ('none', 'messages_hidden', 'counts_only', 'curated_only');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('idea', 'active', 'shipped', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "signal_source" AS ENUM ('github', 'vercel', 'admin', 'system', 'agent');

-- CreateEnum
CREATE TYPE "signal_visibility" AS ENUM ('public', 'private', 'redacted');

-- CreateEnum
CREATE TYPE "date_precision" AS ENUM ('day', 'month', 'year');

-- CreateEnum
CREATE TYPE "timeline_node_kind" AS ENUM ('milestone', 'release', 'progress', 'reflection', 'learning', 'event');

-- CreateEnum
CREATE TYPE "timeline_kind" AS ENUM ('global', 'project', 'evolution', 'custom');

-- CreateEnum
CREATE TYPE "media_kind" AS ENUM ('image', 'video', 'audio', 'model3d', 'document', 'other');

-- CreateEnum
CREATE TYPE "media_provider" AS ENUM ('blob', 'youtube', 'loom', 'deployment', 'external');

-- CreateEnum
CREATE TYPE "favorite_status" AS ENUM ('current', 'past', 'wishlist');

-- CreateEnum
CREATE TYPE "book_page_mode" AS ENUM ('generated', 'authored', 'hybrid');

-- CreateEnum
CREATE TYPE "screen_mode" AS ENUM ('iframe', 'video', 'feed', 'terminal', 'image');

-- CreateEnum
CREATE TYPE "entity_type" AS ENUM ('project', 'repo', 'deployment', 'post', 'timeline_node', 'timeline', 'favorite', 'media', 'book', 'book_page', 'shelf', 'library_zone', 'activity_event', 'skill', 'client', 'ui_layout');

-- CreateEnum
CREATE TYPE "agent_message_role" AS ENUM ('system', 'user', 'assistant', 'tool');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "reflection" JSONB NOT NULL DEFAULT '[]',
    "approx_start" DATE,
    "approx_end" DATE,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "stages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "lk_signal_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" "signal_source" NOT NULL,
    "description" TEXT,
    "public_by_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "lk_signal_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "lk_media_roles" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lk_media_roles_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "lk_skill_categories" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lk_skill_categories_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "lk_library_zone_kinds" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lk_library_zone_kinds_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "favorite_categories" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "attribute_schema" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "favorite_categories_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "github_accounts" (
    "id" UUID NOT NULL,
    "login" TEXT NOT NULL,
    "label" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'personal',
    "avatar_url" TEXT,
    "html_url" TEXT,
    "notes" TEXT,
    "last_synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "github_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repos" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "github_account_id" UUID,
    "github_id" BIGINT,
    "full_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html_url" TEXT,
    "homepage_url" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "is_fork" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "default_branch" TEXT,
    "primary_language" TEXT,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "pushed_at" TIMESTAMPTZ(6),
    "github_created_at" TIMESTAMPTZ(6),
    "activation" "activation_state" NOT NULL DEFAULT 'inactive',
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "redaction_policy" "redaction_policy" NOT NULL DEFAULT 'none',
    "public_alias" TEXT,
    "notes" TEXT,
    "last_synced_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "repos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "public_alias" TEXT,
    "show_name" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'vercel',
    "vercel_project_id" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "iframe_allowed" BOOLEAN NOT NULL DEFAULT false,
    "health_check_url" TEXT,
    "last_status_code" INTEGER,
    "last_status_ok" BOOLEAN,
    "last_latency_ms" INTEGER,
    "last_checked_at" TIMESTAMPTZ(6),
    "screenshot_media_id" UUID,
    "activation" "activation_state" NOT NULL DEFAULT 'tracking',
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "summary" TEXT,
    "body_blocks" JSONB NOT NULL DEFAULT '[]',
    "status" "project_status" NOT NULL DEFAULT 'active',
    "started_on" DATE,
    "ended_on" DATE,
    "client_id" UUID,
    "cover_media_id" UUID,
    "stage_code" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured_rank" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "activation" "activation_state" NOT NULL DEFAULT 'tracking',
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_repos" (
    "project_id" UUID NOT NULL,
    "repo_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'other',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_repos_pkey" PRIMARY KEY ("project_id","repo_id")
);

-- CreateTable
CREATE TABLE "project_deployments" (
    "project_id" UUID NOT NULL,
    "deployment_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'app',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_deployments_pkey" PRIMARY KEY ("project_id","deployment_id")
);

-- CreateTable
CREATE TABLE "project_links" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'link',
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_series" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "post_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "mdx_source" TEXT NOT NULL,
    "frontmatter" JSONB NOT NULL DEFAULT '{}',
    "source_hash" TEXT,
    "reading_minutes" INTEGER,
    "series_id" UUID,
    "canonical_url" TEXT,
    "cover_media_id" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_projects" (
    "post_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,

    CONSTRAINT "post_projects_pkey" PRIMARY KEY ("post_id","project_id")
);

-- CreateTable
CREATE TABLE "post_timeline_nodes" (
    "post_id" UUID NOT NULL,
    "node_id" UUID NOT NULL,

    CONSTRAINT "post_timeline_nodes_pkey" PRIMARY KEY ("post_id","node_id")
);

-- CreateTable
CREATE TABLE "post_assets" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "original_path" TEXT NOT NULL,
    "media_id" UUID NOT NULL,

    CONSTRAINT "post_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "source" "signal_source" NOT NULL,
    "type_code" TEXT NOT NULL,
    "repo_id" UUID,
    "deployment_id" UUID,
    "project_id" UUID,
    "post_id" UUID,
    "actor" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "visibility" "signal_visibility" NOT NULL DEFAULT 'private',
    "dedupe_key" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "scene_effect" TEXT,
    "backfilled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_nodes" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body_blocks" JSONB NOT NULL DEFAULT '[]',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "occurred_until" TIMESTAMPTZ(6),
    "precision" "date_precision" NOT NULL DEFAULT 'day',
    "kind" "timeline_node_kind" NOT NULL DEFAULT 'milestone',
    "stage_code" TEXT,
    "project_id" UUID,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "timeline_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_node_signals" (
    "node_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,

    CONSTRAINT "timeline_node_signals_pkey" PRIMARY KEY ("node_id","event_id")
);

-- CreateTable
CREATE TABLE "timelines" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "timeline_kind" NOT NULL,
    "project_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_memberships" (
    "timeline_id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "chapter_label" TEXT,

    CONSTRAINT "timeline_memberships_pkey" PRIMARY KEY ("timeline_id","node_id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_code" TEXT,
    "description" TEXT,
    "icon_url" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_skills" (
    "node_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER,

    CONSTRAINT "node_skills_pkey" PRIMARY KEY ("node_id","skill_id")
);

-- CreateTable
CREATE TABLE "project_skills" (
    "project_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("project_id","skill_id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "kind" "media_kind" NOT NULL,
    "provider" "media_provider" NOT NULL DEFAULT 'blob',
    "url" TEXT NOT NULL,
    "blob_pathname" TEXT,
    "mime_type" TEXT,
    "bytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_s" DOUBLE PRECISION,
    "blur_data_url" TEXT,
    "poster_media_id" UUID,
    "title" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "purpose" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checksum" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_links" (
    "id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "entity_type" "entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "role_code" TEXT NOT NULL DEFAULT 'gallery',
    "position" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_previews" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "site_name" TEXT,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator" TEXT,
    "url" TEXT,
    "affiliate_url" TEXT,
    "rating" INTEGER,
    "status" "favorite_status" NOT NULL DEFAULT 'current',
    "started_on" DATE,
    "ended_on" DATE,
    "summary" TEXT,
    "why_blocks" JSONB NOT NULL DEFAULT '[]',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "cover_media_id" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_relations" (
    "id" UUID NOT NULL,
    "favorite_id" UUID NOT NULL,
    "entity_type" "entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "note" TEXT,

    CONSTRAINT "favorite_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_zones" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scene_node_name" TEXT,
    "camera_preset" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display" "display_state" NOT NULL DEFAULT 'published',

    CONSTRAINT "library_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "zone_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "scene_node_name" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 24,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelf_slots" (
    "id" UUID NOT NULL,
    "shelf_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "entity_type" "entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "spine_style" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "shelf_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "entity_type" "entity_type",
    "entity_id" UUID,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "cover_media_id" UUID,
    "page_mode" "book_page_mode" NOT NULL DEFAULT 'generated',
    "display" "display_state" NOT NULL DEFAULT 'hidden',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_pages" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "template_code" TEXT,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "book_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "computer_screens" (
    "id" UUID NOT NULL,
    "slot" TEXT NOT NULL,
    "mode" "screen_mode" NOT NULL DEFAULT 'feed',
    "deployment_id" UUID,
    "media_id" UUID,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "computer_screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_assets" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "media_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scene_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_components" (
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "props_schema" JSONB NOT NULL DEFAULT '{}',
    "allowed_contexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ui_components_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ui_layouts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ui_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT,
    "instructions_version" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sessions" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "visitor_id" TEXT,
    "eve_run_id" TEXT,
    "title" TEXT,
    "summary" TEXT,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "role" "agent_message_role" NOT NULL,
    "content" JSONB NOT NULL,
    "tokens" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tool_calls" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "message_id" UUID,
    "tool_name" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "latency_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "requested_by" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" "entity_type",
    "target_id" UUID,
    "summary" TEXT NOT NULL,
    "diff" JSONB NOT NULL DEFAULT '{}',
    "status" "approval_status" NOT NULL DEFAULT 'pending',
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" TEXT,
    "decision_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisions" (
    "id" UUID NOT NULL,
    "entity_type" "entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'john',
    "message" TEXT,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" "entity_type",
    "entity_id" TEXT,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "visitor_id" TEXT,
    "session_id" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "props" JSONB NOT NULL DEFAULT '{}',
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "event_name" TEXT,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "body" JSONB NOT NULL DEFAULT '{}',
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "error" TEXT,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_user_id_idx" ON "admin_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_accounts_login_key" ON "github_accounts"("login");

-- CreateIndex
CREATE UNIQUE INDEX "repos_slug_key" ON "repos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "repos_github_id_key" ON "repos"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "repos_full_name_key" ON "repos"("full_name");

-- CreateIndex
CREATE INDEX "repos_activation_display_idx" ON "repos"("activation", "display");

-- CreateIndex
CREATE UNIQUE INDEX "clients_slug_key" ON "clients"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_slug_key" ON "deployments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_url_key" ON "deployments"("url");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_display_idx" ON "projects"("display");

-- CreateIndex
CREATE INDEX "project_links_project_id_idx" ON "project_links"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_series_slug_key" ON "post_series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_display_published_at_idx" ON "posts"("display", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_assets_post_id_original_path_key" ON "post_assets"("post_id", "original_path");

-- CreateIndex
CREATE UNIQUE INDEX "activity_events_dedupe_key_key" ON "activity_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "activity_events_occurred_at_idx" ON "activity_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_repo_id_occurred_at_idx" ON "activity_events"("repo_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_project_id_occurred_at_idx" ON "activity_events"("project_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_visibility_occurred_at_idx" ON "activity_events"("visibility", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "timeline_nodes_slug_key" ON "timeline_nodes"("slug");

-- CreateIndex
CREATE INDEX "timeline_nodes_occurred_at_idx" ON "timeline_nodes"("occurred_at");

-- CreateIndex
CREATE INDEX "timeline_nodes_project_id_occurred_at_idx" ON "timeline_nodes"("project_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "timelines_slug_key" ON "timelines"("slug");

-- CreateIndex
CREATE INDEX "timeline_memberships_timeline_id_position_idx" ON "timeline_memberships"("timeline_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "media_assets_kind_created_at_idx" ON "media_assets"("kind", "created_at" DESC);

-- CreateIndex
CREATE INDEX "media_links_entity_type_entity_id_role_code_position_idx" ON "media_links"("entity_type", "entity_id", "role_code", "position");

-- CreateIndex
CREATE UNIQUE INDEX "media_links_media_id_entity_type_entity_id_role_code_key" ON "media_links"("media_id", "entity_type", "entity_id", "role_code");

-- CreateIndex
CREATE UNIQUE INDEX "link_previews_url_key" ON "link_previews"("url");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_slug_key" ON "favorites"("slug");

-- CreateIndex
CREATE INDEX "favorites_category_code_sort_order_idx" ON "favorites"("category_code", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_relations_favorite_id_entity_type_entity_id_key" ON "favorite_relations"("favorite_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_zones_slug_key" ON "library_zones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_slug_key" ON "shelves"("slug");

-- CreateIndex
CREATE INDEX "shelf_slots_entity_type_entity_id_idx" ON "shelf_slots"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "shelf_slots_shelf_id_position_key" ON "shelf_slots"("shelf_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "books_slug_key" ON "books"("slug");

-- CreateIndex
CREATE INDEX "books_entity_type_entity_id_idx" ON "books"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_pages_book_id_position_key" ON "book_pages"("book_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "computer_screens_slot_key" ON "computer_screens"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "scene_assets_slug_version_key" ON "scene_assets"("slug", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ui_layouts_slug_key" ON "ui_layouts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "agents_code_key" ON "agents"("code");

-- CreateIndex
CREATE INDEX "agent_sessions_agent_id_started_at_idx" ON "agent_sessions"("agent_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "agent_sessions_visitor_id_idx" ON "agent_sessions"("visitor_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_messages_session_id_seq_key" ON "agent_messages"("session_id", "seq");

-- CreateIndex
CREATE INDEX "agent_tool_calls_session_id_created_at_idx" ON "agent_tool_calls"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "approval_requests_status_created_at_idx" ON "approval_requests"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "revisions_entity_type_entity_id_version_key" ON "revisions"("entity_type", "entity_id", "version");

-- CreateIndex
CREATE INDEX "audit_log_at_idx" ON "audit_log"("at" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_name_at_idx" ON "analytics_events"("name", "at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_source_delivery_id_key" ON "webhook_deliveries"("source", "delivery_id");

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repos" ADD CONSTRAINT "repos_github_account_id_fkey" FOREIGN KEY ("github_account_id") REFERENCES "github_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_screenshot_media_id_fkey" FOREIGN KEY ("screenshot_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_stage_code_fkey" FOREIGN KEY ("stage_code") REFERENCES "stages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_repos" ADD CONSTRAINT "project_repos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_repos" ADD CONSTRAINT "project_repos_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "post_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_projects" ADD CONSTRAINT "post_projects_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_projects" ADD CONSTRAINT "post_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_timeline_nodes" ADD CONSTRAINT "post_timeline_nodes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_timeline_nodes" ADD CONSTRAINT "post_timeline_nodes_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "timeline_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_assets" ADD CONSTRAINT "post_assets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_assets" ADD CONSTRAINT "post_assets_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_type_code_fkey" FOREIGN KEY ("type_code") REFERENCES "lk_signal_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_stage_code_fkey" FOREIGN KEY ("stage_code") REFERENCES "stages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_node_signals" ADD CONSTRAINT "timeline_node_signals_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "timeline_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_node_signals" ADD CONSTRAINT "timeline_node_signals_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "activity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelines" ADD CONSTRAINT "timelines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_memberships" ADD CONSTRAINT "timeline_memberships_timeline_id_fkey" FOREIGN KEY ("timeline_id") REFERENCES "timelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_memberships" ADD CONSTRAINT "timeline_memberships_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "timeline_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_code_fkey" FOREIGN KEY ("category_code") REFERENCES "lk_skill_categories"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_skills" ADD CONSTRAINT "node_skills_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "timeline_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_skills" ADD CONSTRAINT "node_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_poster_media_id_fkey" FOREIGN KEY ("poster_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_role_code_fkey" FOREIGN KEY ("role_code") REFERENCES "lk_media_roles"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_category_code_fkey" FOREIGN KEY ("category_code") REFERENCES "favorite_categories"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_relations" ADD CONSTRAINT "favorite_relations_favorite_id_fkey" FOREIGN KEY ("favorite_id") REFERENCES "favorites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_zones" ADD CONSTRAINT "library_zones_kind_code_fkey" FOREIGN KEY ("kind_code") REFERENCES "lk_library_zone_kinds"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "library_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_slots" ADD CONSTRAINT "shelf_slots_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_pages" ADD CONSTRAINT "book_pages_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "computer_screens" ADD CONSTRAINT "computer_screens_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "computer_screens" ADD CONSTRAINT "computer_screens_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_assets" ADD CONSTRAINT "scene_assets_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_calls" ADD CONSTRAINT "agent_tool_calls_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_calls" ADD CONSTRAINT "agent_tool_calls_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "agent_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

