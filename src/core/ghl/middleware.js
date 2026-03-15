import { db } from '../db/client.js';
import { subscriptions, plans } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';
import { env } from '../env.js';
import { createError } from '../middleware/errorHandler.js';

// Apps covered by the Suite plan
const SUITE_APPS = ['smartbuild', 'idearoom', 'quickbooks', 'monday'];

/**
 * Validate the internal X-API-Key header.
 * Used to secure internal service-to-service calls.
 */
export function verifyApiKey(req, _res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== env.X_API_KEY) {
    return next(createError(401, 'Invalid or missing API key'));
  }
  next();
}

/**
 * Factory: returns middleware that checks whether the authenticated location
 * has an active subscription covering the given appSlug.
 *
 * Usage: router.use(checkSubscription('idearoom'))
 */
export function checkSubscription(appSlug) {
  return async (req, _res, next) => {
    try {
      const locationId = req.user?.locationId;
      if (!locationId) {
        throw createError(401, 'Authentication required');
      }

      // Find active subscriptions for this location
      const activeSubs = await db
        .select({ planAppSlug: plans.appSlug })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(
          and(
            eq(subscriptions.locationId, locationId),
            eq(subscriptions.status, 'active'),
          ),
        );

      const appSlugs = activeSubs.map((s) => s.planAppSlug);

      const hasAccess =
        appSlugs.includes(appSlug) ||
        (appSlugs.includes('suite') && SUITE_APPS.includes(appSlug));

      if (!hasAccess) {
        throw createError(403, `Active subscription required for ${appSlug}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
