import './env.js';
import pg from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';

const { Pool } = pg;
const sslDisabled = process.env.PGSSLMODE === 'disable';
const sslRequested = process.env.PGSSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require') || (process.env.NODE_ENV === 'production' && !sslDisabled);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
  ssl: sslRequested && !sslDisabled ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } : false,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
  return pool.query<T>(text, values);
}
