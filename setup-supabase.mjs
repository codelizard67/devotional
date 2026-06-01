import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://lhpoqyqnaahoietagmbr.supabase.co';
const supabaseKey = 'sb_publishable_gU4CQtFgFqp30fHDkxZj7Q_HynFlsgi';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSetup() {
  try {
    console.log('Reading SQL file...');
    const sql = readFileSync('./supabase_setup.sql', 'utf-8');

    console.log('Executing SQL setup...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ Database setup complete!');
    console.log(data);
  } catch (err) {
    console.error('Setup error:', err);
  }
}

runSetup();
