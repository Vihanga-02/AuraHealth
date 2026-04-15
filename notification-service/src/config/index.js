import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5006,
  databaseUrl: process.env.DATABASE_URL,
  smsApiKey: process.env.SMS_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};

const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('connect', () => {
  console.log('Connected to Notification Database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { pool };
export default pool;
