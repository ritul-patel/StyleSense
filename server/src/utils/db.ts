import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default {
  query: (text: string, params: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
};
