import './env.js';
import app from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
const server = app.listen(port, host, () => {
  console.log(`DCY Dairy Farm API listening on http://${host}:${port}`);
  if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not configured; database-backed routes will not work until it is set.');
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== 'production') console.warn('SESSION_SECRET is unset; a temporary development-only session secret is in use.');
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing server.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });
