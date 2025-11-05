ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "notify_email" boolean DEFAULT true NOT NULL;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "notify_push" boolean DEFAULT false NOT NULL;
