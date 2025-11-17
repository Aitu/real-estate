ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "contact_email" varchar(255);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(32);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "display_email" boolean DEFAULT true NOT NULL;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "display_phone" boolean DEFAULT true NOT NULL;

-- Ensure legacy rows have sensible defaults for the new columns
UPDATE "listings"
SET
  "display_email" = COALESCE("display_email", true),
  "display_phone" = COALESCE("display_phone", true);
