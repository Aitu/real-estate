import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  locale: varchar('locale', { length: 5 }).default('en'),
  phoneNumber: varchar('phone_number', { length: 32 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const listings = pgTable(
  'listings',
  {
    id: serial('id').primaryKey(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 160 }).notNull(),
    title: varchar('title', { length: 180 }).notNull(),
    description: text('description'),
    propertyType: varchar('property_type', { length: 50 }).notNull(),
    transactionType: varchar('transaction_type', { length: 20 })
      .notNull()
      .default('sale'),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    price: integer('price').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    parkingSpaces: integer('parking_spaces'),
    area: integer('area'),
    lotArea: integer('lot_area'),
    yearBuilt: integer('year_built'),
    energyClass: varchar('energy_class', { length: 5 }),
    floor: integer('floor'),
    totalFloors: integer('total_floors'),
    street: varchar('street', { length: 180 }),
    city: varchar('city', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 12 }).notNull(),
    country: varchar('country', { length: 2 }).notNull().default('LU'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    publishedAt: timestamp('published_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    ownerIdx: index('listings_owner_idx').on(table.ownerId),
    cityIdx: index('listings_city_idx').on(table.city),
    statusIdx: index('listings_status_idx').on(table.status),
    slugUnique: uniqueIndex('listings_slug_unique').on(table.slug),
  })
);

export const listingImages = pgTable(
  'listing_images',
  {
    id: serial('id').primaryKey(),
    listingId: integer('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: varchar('alt', { length: 180 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    listingIdx: index('listing_images_listing_idx').on(table.listingId),
  })
);

export const listingFeatures = pgTable(
  'listing_features',
  {
    id: serial('id').primaryKey(),
    listingId: integer('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 120 }).notNull(),
    value: varchar('value', { length: 255 }),
    icon: varchar('icon', { length: 60 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    listingIdx: index('listing_features_listing_idx').on(table.listingId),
  })
);

export const favorites = pgTable(
  'favorites',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: integer('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userListingUnique: uniqueIndex('favorites_user_listing_unique').on(
      table.userId,
      table.listingId
    ),
  })
);

export const alerts = pgTable(
  'alerts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    minPrice: integer('min_price'),
    maxPrice: integer('max_price'),
    propertyTypes: varchar('property_types', { length: 255 }),
    transactionType: varchar('transaction_type', { length: 20 }).default('sale'),
    minBedrooms: integer('min_bedrooms'),
    maxBedrooms: integer('max_bedrooms'),
    city: varchar('city', { length: 100 }),
    postalCodes: varchar('postal_codes', { length: 100 }),
    radiusKm: integer('radius_km'),
    frequency: varchar('frequency', { length: 20 }).default('instant'),
    lastTriggeredAt: timestamp('last_triggered_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('alerts_user_idx').on(table.userId),
  })
);

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  listings: many(listings),
  favorites: many(favorites),
  alerts: many(alerts),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  owner: one(users, {
    fields: [listings.ownerId],
    references: [users.id],
  }),
  images: many(listingImages),
  favorites: many(favorites),
  features: many(listingFeatures),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, {
    fields: [listingImages.listingId],
    references: [listings.id],
  }),
}));

export const listingFeaturesRelations = relations(
  listingFeatures,
  ({ one }) => ({
    listing: one(listings, {
      fields: [listingFeatures.listingId],
      references: [listings.id],
    }),
  })
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id],
  }),
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingImage = typeof listingImages.$inferSelect;
export type NewListingImage = typeof listingImages.$inferInsert;
export type ListingFeature = typeof listingFeatures.$inferSelect;
export type NewListingFeature = typeof listingFeatures.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
