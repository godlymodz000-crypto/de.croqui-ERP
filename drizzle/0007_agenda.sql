CREATE TYPE "public"."calendar_status" AS ENUM('connected', 'reconnect');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('site_visit', 'client_meeting', 'delivery', 'internal_deadline', 'personal');--> statement-breakpoint
CREATE TYPE "public"."event_source" AS ENUM('erp', 'google');--> statement-breakpoint
CREATE TYPE "public"."event_sync_status" AS ENUM('synced', 'pending', 'error');--> statement-breakpoint
CREATE TABLE "calendar_sync_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"calendar_id" text NOT NULL,
	"status" "calendar_status" DEFAULT 'connected' NOT NULL,
	"sync_token" text,
	"last_attempt_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"description" text,
	"kind" "event_kind",
	"project_id" uuid,
	"source" "event_source" NOT NULL,
	"google_event_id" text,
	"google_etag" text,
	"google_calendar_id" text,
	"recurring_event_id" text,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_status" "event_sync_status" DEFAULT 'pending' NOT NULL,
	"sync_error" text,
	"sync_attempts" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "events_google_event_id_unique" UNIQUE("google_event_id")
);
--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ADD CONSTRAINT "calendar_sync_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_range_idx" ON "events" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "events_unsynced_idx" ON "events" USING btree ("updated_at") WHERE "events"."sync_status" <> 'synced';--> statement-breakpoint
-- Mesmo padrão das outras tabelas no Supabase: RLS ligada e sem políticas. Só o servidor do ERP
-- (dono das tabelas) lê e grava; a API pública do Supabase não enxerga nada.
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ENABLE ROW LEVEL SECURITY;
