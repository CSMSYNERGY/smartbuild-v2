import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requestLogger } from './core/middleware/logger.js';
import { generalLimiter } from './core/middleware/rateLimiter.js';
import { errorHandler } from './core/middleware/errorHandler.js';
import { env } from './core/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.SMARTBUILD_BASE_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(requestLogger);

// Rate limiting
app.use(generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// Serve React frontend at /app
app.use('/app', express.static(join(__dirname, '..', 'frontend', 'dist')));
app.get('/app/*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// TODO: mount API routers here
// app.use('/api/auth', authRouter);
// app.use('/api/ghl', ghlRouter);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`SmartBuild v2 listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
