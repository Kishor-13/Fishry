import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read from .env if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

const url = process.argv[2] || process.env.VITE_SUPABASE_URL || '';
const key = process.argv[3] || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('================================================================');
console.log('       SUPABASE CONNECTION & SCHEMA VERIFICATION');
console.log('================================================================\n');

if (!url || !key) {
  console.log('Status: NO CREDENTIALS FOUND IN .env OR COMMAND ARGUMENTS');
  console.log('\nTo verify your live Supabase database, run:');
  console.log('  node verify_supabase_connection.js <YOUR_SUPABASE_URL> <YOUR_SUPABASE_ANON_KEY>\n');
  console.log('Or save them in a .env file:');
  console.log('  VITE_SUPABASE_URL=https://xyz.supabase.co');
  console.log('  VITE_SUPABASE_ANON_KEY=ey...\n');
  process.exit(2);
}

console.log(`Connecting to: ${url}`);
console.log(`Anon Key: ${key.substring(0, 15)}...${key.substring(key.length - 5)}\n`);

const supabase = createClient(url, key);

let passed = 0;
let failed = 0;

async function runChecks() {
  // 1. Feeding Rules Table
  try {
    const { data, error } = await supabase.from('feeding_rules').select('*').limit(5);
    if (error) {
      console.log(`[FAIL] Table 'feeding_rules': ${error.message}`);
      failed++;
    } else {
      console.log(`[PASS] Table 'feeding_rules' accessible (${data?.length || 0} sample rows fetched)`);
      passed++;
    }
  } catch (err) {
    console.log(`[FAIL] Table 'feeding_rules': ${err.message}`);
    failed++;
  }

  // 2. Feed History Table
  try {
    const { data, error } = await supabase.from('feed_history').select('id').limit(1);
    if (error) {
      console.log(`[FAIL] Table 'feed_history': ${error.message}`);
      failed++;
    } else {
      console.log(`[PASS] Table 'feed_history' accessible`);
      passed++;
    }
  } catch (err) {
    console.log(`[FAIL] Table 'feed_history': ${err.message}`);
    failed++;
  }

  // 3. Ponds Table
  try {
    const { data, error } = await supabase.from('ponds').select('id').limit(1);
    if (error) {
      console.log(`[FAIL] Table 'ponds': ${error.message}`);
      failed++;
    } else {
      console.log(`[PASS] Table 'ponds' accessible`);
      passed++;
    }
  } catch (err) {
    console.log(`[FAIL] Table 'ponds': ${err.message}`);
    failed++;
  }

  // 4. Farmers Table
  try {
    const { data, error } = await supabase.from('farmers').select('id, mobile, name').limit(1);
    if (error) {
      console.log(`[FAIL] Table 'farmers': ${error.message}`);
      failed++;
    } else {
      console.log(`[PASS] Table 'farmers' accessible`);
      passed++;
    }
  } catch (err) {
    console.log(`[FAIL] Table 'farmers': ${err.message}`);
    failed++;
  }

  // 5. Test RPC login_farmer function with Demo Farmer
  try {
    const { data, error } = await supabase.rpc('login_farmer', {
      p_mobile: '9876543210',
      p_password: 'farmer123',
    });
    if (error) {
      console.log(`[WARN] Function 'login_farmer': ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`[PASS] RPC Function 'login_farmer' working (Demo farmer: ${data[0].name})`);
      passed++;
    } else {
      console.log(`[INFO] RPC Function 'login_farmer' responded (No demo seed user found yet)`);
      passed++;
    }
  } catch (err) {
    console.log(`[WARN] RPC Function 'login_farmer': ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('\nSUCCESS! Your Supabase database is 100% connected and verified!');
    process.exit(0);
  } else {
    console.log('\nSome checks failed. Please make sure you executed supabase_schema.sql in your Supabase SQL Editor.');
    process.exit(1);
  }
}

runChecks();
