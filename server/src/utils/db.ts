import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('[pg] Unexpected pool error:', err.message);
});

export const query = (text: string, params: any[]) => pool.query(text, params);
export const connect = () => pool.connect();