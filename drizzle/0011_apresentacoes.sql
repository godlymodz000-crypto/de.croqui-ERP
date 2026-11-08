CREATE TABLE "presentation_image_uses" (
	"presentation_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	CONSTRAINT "presentation_image_uses_pk" PRIMARY KEY("presentation_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "presentation_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"owner_presentation_id" uuid,
	"drive_file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"width_px" integer NOT NULL,
	"height_px" integer NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trashed_at" timestamp with time zone,
	CONSTRAINT "presentation_images_drive_file_id_unique" UNIQUE("drive_file_id"),
	CONSTRAINT "presentation_images_owner" CHECK (("presentation_images"."project_id" is null) <> ("presentation_images"."owner_presentation_id" is null))
);
--> statement-breakpoint
CREATE TABLE "presentations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"name" text NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "presentations_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_drive_file_id" text,
	"pdf_name" text,
	"pdf_version" integer DEFAULT 0 NOT NULL,
	"pdf_exported_at" timestamp with time zone,
	"pdf_source_hash" text,
	CONSTRAINT "presentations_name_not_blank" CHECK (length(btrim("presentations"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "presentation_image_uses" ADD CONSTRAINT "presentation_image_uses_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_image_uses" ADD CONSTRAINT "presentation_image_uses_image_id_presentation_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."presentation_images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_images" ADD CONSTRAINT "presentation_images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_images" ADD CONSTRAINT "presentation_images_owner_presentation_id_presentations_id_fk" FOREIGN KEY ("owner_presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_images" ADD CONSTRAINT "presentation_images_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "presentation_image_uses_image_idx" ON "presentation_image_uses" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "presentation_images_project_created_idx" ON "presentation_images" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "presentation_images_owner_idx" ON "presentation_images" USING btree ("owner_presentation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "presentations_number_idx" ON "presentations" USING btree ("number");--> statement-breakpoint
CREATE INDEX "presentations_project_updated_idx" ON "presentations" USING btree ("project_id","updated_at");--> statement-breakpoint
-- Mesmo padrão das outras tabelas no Supabase: RLS ligada e sem políticas. Só o servidor do ERP
-- (dono das tabelas) lê e grava; a API pública do Supabase não enxerga nada.
ALTER TABLE "presentations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "presentation_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "presentation_image_uses" ENABLE ROW LEVEL SECURITY;
