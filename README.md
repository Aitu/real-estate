# LuxNest Real Estate Platform

LuxNest is a localized real estate experience for the Luxembourg market built on the Next.js App Router. The marketing surface delivers a guided search, curated listings, and map exploration while preparing the groundwork for authenticated features such as favorites, alerts, and owner dashboards.

## Key features
- **Locale-aware routing and translations** for English, French, and German with automatic negotiation, ensuring every page loads the correct copy and formatting for the visitor.【F:app/[locale]/layout.tsx†L1-L29】【F:messages/en.json†L1-L57】【F:middleware.ts†L1-L57】
- **Responsive marketing layout** composed of a hero section, multi-criteria search form, featured listings section, and site footer built with shadcn/ui primitives.【F:app/[locale]/(marketing)/page.tsx†L1-L82】【F:components/search/listing-search-form.tsx†L1-L161】【F:components/layout/site-footer.tsx†L1-L33】
- **Interactive navigation that adapts to authentication state**, offering quick access to favorites, personal listings, and alerts from desktop and mobile breakpoints.【F:components/layout/site-header.tsx†L1-L199】
- **Rich listing cards with animated favorites** highlighting imagery, pricing, amenities, and localized formatting to showcase each property at a glance.【F:components/listings/listing-card.tsx†L1-L111】
- **Mapbox-powered geographic exploration** that places featured listings on an interactive map, ready to be wired to live Supabase data.【F:components/map/listings-map.tsx†L1-L75】【F:lib/mapbox.ts†L1-L3】
- **Mock data layer and typed listing models** designed so you can swap in Supabase queries without rewriting the UI surfaces.【F:lib/mock/listings.ts†L1-L238】【F:lib/types/listing.ts†L1-L40】【F:lib/data/listings.ts†L1-L7】

## Tech stack
- [Next.js 15 App Router](https://nextjs.org/) with React Server Components and middleware internationalization.
- [Drizzle ORM](https://orm.drizzle.team/) targeting Supabase Postgres for persistence.
- [shadcn/ui](https://ui.shadcn.com/) component primitives styled with Tailwind CSS.
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) for interactive maps.
- Planned authentication with NextAuth and Supabase adapters inherited from the starter template.

## Getting started
1. **Install dependencies** using your preferred package manager (pnpm recommended):
   ```bash
   pnpm install
   ```
2. **Configure environment variables** by copying `.env.example` to `.env` (or `.env.local`) and filling in your Supabase and auth secrets. You can wipe and reseed the database at any time using the provided scripts.【F:.env.example†L1-L7】
   ```bash
   cp .env.example .env
   pnpm db:setup
   pnpm db:migrate
   pnpm db:seed
   ```
3. **Update the Mapbox token** if needed by editing `lib/mapbox.ts`. The repository currently ships with a public development token that you can replace with your own for production use.【F:lib/mapbox.ts†L1-L3】
4. **Run the development server**:
   ```bash
   pnpm dev
   ```
   The landing page is served at `http://localhost:3000`, and visitors are redirected to their preferred locale route automatically.【F:middleware.ts†L19-L34】

## Localization workflow
Translation catalogs live in `messages/<locale>.json`. Use the same keys across locales to keep the UI consistent. When you add new UI copy, update each locale file and consume translations via the `useTranslations` hook or `getTranslator` helper.【F:messages/en.json†L1-L57】【F:lib/i18n/provider.tsx†L1-L62】【F:lib/i18n/server.ts†L1-L12】

## Preparing for real data
The marketing page currently consumes strongly typed mock listings. Replace `getFeaturedListings` in `lib/data/listings.ts` with a Drizzle query once the listings table is populated. Listing cards and the map already expect coordinates, media, and pricing fields defined in `lib/types/listing.ts`, aligning with the database schema introduced earlier.【F:lib/data/listings.ts†L1-L7】【F:lib/mock/listings.ts†L1-L238】【F:lib/types/listing.ts†L1-L40】

## Next steps
- Wire the authentication flows (Task 3) to enable the navigation’s logged-in states.
- Replace mock listing data with Supabase-backed queries and server actions.
- Extend the marketing experience with additional localized pages (favorites, alerts, listing detail) as they come online.
