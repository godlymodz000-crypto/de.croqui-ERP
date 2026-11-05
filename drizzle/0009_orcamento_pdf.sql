ALTER TABLE "budgets" ADD COLUMN "pdf_drive_file_id" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "pdf_name" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "pdf_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "pdf_exported_at" timestamp with time zone;