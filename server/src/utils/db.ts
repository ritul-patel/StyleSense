import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool tuning
  max: 10,                    // Max connections in pool
  idleTimeoutMillis: 30_000,  // Close idle connections after 30s
  connectionTimeoutMillis: 10_000, // Fail fast if connection takes > 10s (catches DNS hangs)
});

pool.on('error', (err) => {
  console.error('[pg] Unexpected pool error:', err.message);
});

export const query = (text: string, params: any[]) => pool.query(text, params);
export const connect = () => pool.connect();