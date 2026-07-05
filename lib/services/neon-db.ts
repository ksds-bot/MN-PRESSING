/**
 * Neon Database Configuration
 * PostgreSQL Database Connection
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a query on the database
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a single row from the database
 */
export async function getOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Get all rows from a query
 */
export async function getAll<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute an insert and return the inserted row
 */
export async function insert<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  return getOne<T>(text, params);
}

/**
 * Execute an update and return the updated row
 */
export async function update<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  return getOne<T>(text, params);
}

/**
 * Execute a delete query
 */
export async function deleteRecord(text: string, params?: any[]): Promise<number> {
  const result = await query(text, params);
  return result.rowCount || 0;
}

/**
 * Close the database connection
 */
export async function closeConnection(): Promise<void> {
  await pool.end();
}

export default pool;
