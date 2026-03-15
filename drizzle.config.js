import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/db/schema.js',
  out: './src/core/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
