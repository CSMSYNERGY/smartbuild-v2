import { ZodError } from 'zod';

/**
 * Create a structured HTTP error.
 */
export function createError(status, message, details = undefined) {
  const err = new Error(message);
  err.status = status;
  if (details !== undefined) err.details = details;
  return err;
}

/**
 * Express 5 global error handler.
 * Must have exactly 4 parameters to be recognised by Express as an error handler.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Zod validation errors → 422
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'Validation error',
      issues: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  const status = err.status ?? 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}
