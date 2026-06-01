import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  host: 'db.lhpoqyqnaahoietagmbr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Mrrobot0720$',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    console.log('🔄 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📝 Reading SQL setup file...');
    const sql = readFileSync('./supabase_setup.sql', 'utf-8');
    
    console.log('⚙️  Executing database setup...');
    await client.query(sql);
    
    console.log('✅ Database setup complete!');
    console.log('✅ Tables created: users, bookmarks, notes, highlights');
    console.log('✅ RLS policies enabled for all tables');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
