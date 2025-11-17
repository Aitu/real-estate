ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "promotion_tier" varchar(20) DEFAULT 'standard' NOT NULL;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;

UPDATE "listings"
SET
  "promotion_tier" = COALESCE("promotion_tier", 'standard'),
  "payment_status" = CASE
    WHEN "status" = 'published' THEN 'paid'
    ELSE COALESCE("payment_status", 'unpaid')
  END;
