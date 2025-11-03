ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locale" varchar(5) DEFAULT 'en';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" varchar(32);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;

CREATE TABLE IF NOT EXISTS "listings" (
  "id" serial PRIMARY KEY NOT NULL,
  "owner_id" integer NOT NULL,
  "slug" varchar(160) NOT NULL,
  "title" varchar(180) NOT NULL,
  "description" text,
  "property_type" varchar(50) NOT NULL,
  "transaction_type" varchar(20) DEFAULT 'sale' NOT NULL,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "price" integer NOT NULL,
  "currency" varchar(3) DEFAULT 'EUR' NOT NULL,
  "bedrooms" integer,
  "bathrooms" integer,
  "parking_spaces" integer,
  "area" integer,
  "lot_area" integer,
  "year_built" integer,
  "energy_class" varchar(5),
  "floor" integer,
  "total_floors" integer,
  "street" varchar(180),
  "city" varchar(100) NOT NULL,
  "postal_code" varchar(12) NOT NULL,
  "country" varchar(2) DEFAULT 'LU' NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "published_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "listing_images" (
  "id" serial PRIMARY KEY NOT NULL,
  "listing_id" integer NOT NULL,
  "url" text NOT NULL,
  "alt" varchar(180),
  "is_primary" boolean DEFAULT false NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "property_features" (
  "id" serial PRIMARY KEY NOT NULL,
  "listing_id" integer NOT NULL,
  "label" varchar(120) NOT NULL,
  "value" varchar(255),
  "icon" varchar(60),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "listing_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "favorites_user_listing_unique" UNIQUE("user_id", "listing_id")
);

CREATE TABLE IF NOT EXISTS "alerts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "title" varchar(120) NOT NULL,
  "min_price" integer,
  "max_price" integer,
  "property_types" varchar(255),
  "transaction_type" varchar(20) DEFAULT 'sale',
  "min_bedrooms" integer,
  "max_bedrooms" integer,
  "city" varchar(100),
  "postal_codes" varchar(100),
  "radius_km" integer,
  "frequency" varchar(20) DEFAULT 'instant',
  "last_triggered_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "listings_owner_idx" ON "listings" ("owner_id");
CREATE INDEX IF NOT EXISTS "listings_city_idx" ON "listings" ("city");
CREATE INDEX IF NOT EXISTS "listings_status_idx" ON "listings" ("status");
CREATE INDEX IF NOT EXISTS "listing_images_listing_idx" ON "listing_images" ("listing_id");
CREATE INDEX IF NOT EXISTS "property_features_listing_idx" ON "property_features" ("listing_id");
CREATE INDEX IF NOT EXISTS "alerts_user_idx" ON "alerts" ("user_id");

DO $$ BEGIN
 ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "property_features" ADD CONSTRAINT "property_features_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
