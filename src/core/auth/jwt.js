import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { createError } from '../middleware/errorHandler.js';

const COOKIE_NAME = 'sb_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms
  path: '/',
};

export function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, env.APP_JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return next(createError(401, 'Authentication required'));
  }

  try {
    req.user = jwt.verify(token, env.APP_JWT_SECRET);
    next();
  } catch {
    clearAuthCookie(res);
    next(createError(401, 'Invalid or expired session'));
  }
}
