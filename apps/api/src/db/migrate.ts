import { pool } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('Running database migrations...');

  try {
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(initSql);
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }

  await pool.end();
  process.exit(0);
}

migrate();