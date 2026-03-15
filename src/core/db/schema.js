import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Plans ───────────────────────────────────────────────────────────────────
export const plans = pgTable('plans', {
  id: text('id').primaryKey(),                          // e.g. 'smartbuild_monthly'
  name: text('name').notNull(),
  appSlug: text('app_slug').notNull(),                  // 'smartbuild' | 'idearoom' | etc.
  billingInterval: text('billing_interval').notNull(),  // 'monthly' | 'annual'
  priceUsd: integer('price_usd').notNull(),             // cents
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Locations ────────────────────────────────────────────────────────────────
export const locations = pgTable('locations', {
  id: text('id').primaryKey(),                          // GHL locationId
  companyId: text('company_id'),
  name: text('name'),
  email: text('email'),
  ghlAccessToken: text('ghl_access_token'),
  ghlRefreshToken: text('ghl_refresh_token'),
  ghlTokenExpiresAt: timestamp('ghl_token_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),                          // Deposyt subscription id
  locationId: text('location_id').notNull().references(() => locations.id),
  planId: text('plan_id').notNull().references(() => plans.id),
  status: text('status').notNull(),                     // 'active' | 'canceled' | 'past_due'
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('subscriptions_location_id_idx').on(t.locationId),
  index('subscriptions_plan_id_idx').on(t.planId),
]);

// ─── Webhook Events ───────────────────────────────────────────────────────────
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),                          // idempotency key
  source: text('source').notNull(),                     // 'ghl' | 'deposyt'
  eventType: text('event_type').notNull(),
  locationId: text('location_id'),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'processed' | 'failed'
  error: text('error'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('webhook_events_location_id_idx').on(t.locationId),
  index('webhook_events_status_idx').on(t.status),
]);

// ─── Mappers ──────────────────────────────────────────────────────────────────
export const mappers = pgTable('mappers', {
  id: text('id').primaryKey(),
  locationId: text('location_id').notNull().references(() => locations.id),
  appSlug: text('app_slug').notNull(),
  mapperType: text('mapper_type').notNull(),            // e.g. 'opportunity_stage', 'contact_tag'
  externalKey: text('external_key').notNull(),
  ghlValue: text('ghl_value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('mappers_location_app_type_key_uidx').on(
    t.locationId, t.appSlug, t.mapperType, t.externalKey,
  ),
]);

// ─── Integration Credentials ──────────────────────────────────────────────────
export const integrationCredentials = pgTable('integration_credentials', {
  id: text('id').primaryKey(),
  locationId: text('location_id').notNull().references(() => locations.id),
  appSlug: text('app_slug').notNull(),
  encryptedPayload: text('encrypted_payload').notNull(), // AES-256-GCM JSON blob
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('integration_credentials_location_app_uidx').on(t.locationId, t.appSlug),
]);

// ─── Relations ────────────────────────────────────────────────────────────────
export const locationsRelations = relations(locations, ({ many }) => ({
  subscriptions: many(subscriptions),
  mappers: many(mappers),
  integrationCredentials: many(integrationCredentials),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  location: one(locations, { fields: [subscriptions.locationId], references: [locations.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
}));

export const mappersRelations = relations(mappers, ({ one }) => ({
  location: one(locations, { fields: [mappers.locationId], references: [locations.id] }),
}));

export const integrationCredentialsRelations = relations(integrationCredentials, ({ one }) => ({
  location: one(locations, {
    fields: [integrationCredentials.locationId],
    references: [locations.id],
  }),
}));
