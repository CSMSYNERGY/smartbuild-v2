import { db } from '../db/client.js';
import { webhookEvents } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Check whether a webhook event has already been processed (idempotency guard).
 * Returns true if the event exists and is not in 'failed' status.
 */
export async function isDuplicateEvent(eventId) {
  const [existing] = await db
    .select({ status: webhookEvents.status })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, eventId))
    .limit(1);

  return existing !== undefined && existing.status !== 'failed';
}

/**
 * Insert a new webhook event record with status 'pending'.
 */
export async function logWebhookEvent({ id, source, eventType, locationId, payload }) {
  await db.insert(webhookEvents).values({
    id,
    source,
    eventType,
    locationId: locationId ?? null,
    payload,
    status: 'pending',
  });
}

/**
 * Mark a previously logged event as successfully processed.
 */
export async function markEventProcessed(eventId) {
  await db
    .update(webhookEvents)
    .set({ status: 'processed', processedAt: new Date() })
    .where(eq(webhookEvents.id, eventId));
}

/**
 * Mark a previously logged event as failed, storing the error message.
 */
export async function markEventFailed(eventId, error) {
  await db
    .update(webhookEvents)
    .set({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    })
    .where(eq(webhookEvents.id, eventId));
}
