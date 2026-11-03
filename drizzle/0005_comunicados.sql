CREATE TYPE "public"."broadcast_audience" AS ENUM('all', 'members', 'viewers', 'people');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('deletion.requested', 'deletion.approved', 'deletion.rejected', 'drive.failed', 'announcement');--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid,
	"audience" "broadcast_audience" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sender_user_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "broadcast_id" uuid;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "broadcasts_created_idx" ON "broadcasts" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_broadcast_id_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."broadcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","created_at") WHERE "notifications"."read_at" is null;--> statement-breakpoint
CREATE INDEX "notifications_broadcast_idx" ON "notifications" USING btree ("broadcast_id");