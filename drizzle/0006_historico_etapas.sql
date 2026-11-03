CREATE TABLE "project_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"from_stage_id" uuid NOT NULL,
	"to_stage_id" uuid NOT NULL,
	"user_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_stage_history" ADD CONSTRAINT "project_stage_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_history" ADD CONSTRAINT "project_stage_history_from_stage_id_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_history" ADD CONSTRAINT "project_stage_history_to_stage_id_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stage_history" ADD CONSTRAINT "project_stage_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_stage_history_project_at_idx" ON "project_stage_history" USING btree ("project_id","at");--> statement-breakpoint
-- Mesmo padrão das outras tabelas no Supabase: RLS ligada e sem políticas. Só o servidor do ERP
-- (dono das tabelas) lê e grava; a API pública do Supabase não enxerga nada.
ALTER TABLE "project_stage_history" ENABLE ROW LEVEL SECURITY;