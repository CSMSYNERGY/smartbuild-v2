import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../env.js';

const migrationClient = postgres(env.DATABASE_URL, { max: 1 });

try {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: './src/core/db/migrations',
  });
  console.log('Migrations complete.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await migrationClient.end();
}
