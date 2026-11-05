CREATE TYPE "public"."budget_status" AS ENUM('draft', 'sent');--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"name" text NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "budgets_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" "budget_status" DEFAULT 'draft' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_cents" bigint DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budgets_name_not_blank" CHECK (length(btrim("budgets"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_number_idx" ON "budgets" USING btree ("number");--> statement-breakpoint
CREATE INDEX "budgets_project_updated_idx" ON "budgets" USING btree ("project_id","updated_at");--> statement-breakpoint
-- Mesmo padrão das outras tabelas no Supabase: RLS ligada e sem políticas. Só o servidor do ERP
-- (dono das tabelas) lê e grava; a API pública do Supabase não enxerga nada.
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
