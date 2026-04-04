import dotenv from 'dotenv';
import { Pool, QueryResult, QueryResultRow } from 'pg';

dotenv.config();

const connectionString: string = process.env.DATABASE_URL ?? '';

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString,
});

export const query = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

export const connectWithRetry = async (): Promise<void> => {
  const maxAttempts: number = 10;
  const delayMs: number = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ auth-service connected to PostgreSQL');
      return;
    } catch (error: unknown) {
      console.error(`PostgreSQL connection attempt ${attempt}/${maxAttempts} failed`, error);

      if (attempt === maxAttempts) {
        throw new Error('auth-service could not connect to PostgreSQL');
      }

      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }
};

export default pool;
