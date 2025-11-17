DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'listing_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.listing_status AS ENUM ('draft', 'published', 'inactive');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'listing_transaction_type'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.listing_transaction_type AS ENUM ('sale', 'rent');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'listing_promotion_tier'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.listing_promotion_tier AS ENUM ('standard', 'plus', 'premium');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'listing_payment_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.listing_payment_status AS ENUM ('paid', 'unpaid');
  END IF;
END $$;

ALTER TABLE "listings"
  ALTER COLUMN "transaction_type" TYPE listing_transaction_type USING "transaction_type"::listing_transaction_type,
  ALTER COLUMN "transaction_type" SET DEFAULT 'sale',
  ALTER COLUMN "status" TYPE listing_status USING "status"::listing_status,
  ALTER COLUMN "status" SET DEFAULT 'draft',
  ALTER COLUMN "promotion_tier" TYPE listing_promotion_tier USING "promotion_tier"::listing_promotion_tier,
  ALTER COLUMN "promotion_tier" SET DEFAULT 'standard',
  ALTER COLUMN "payment_status" TYPE listing_payment_status USING "payment_status"::listing_payment_status,
  ALTER COLUMN "payment_status" SET DEFAULT 'unpaid';

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_user_team_unique" ON "team_members" ("user_id", "team_id");
