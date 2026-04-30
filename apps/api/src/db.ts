import { Pool } from 'pg';

let pool: Pool | null = null;

export const initPool = (connectionString: string, ssl?: any) => {
  pool = new Pool({
    connectionString,
    ssl,
  });
  return pool;
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
};

export { pool };