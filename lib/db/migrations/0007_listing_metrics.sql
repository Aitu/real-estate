ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "views_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "contacts_count" integer NOT NULL DEFAULT 0;
