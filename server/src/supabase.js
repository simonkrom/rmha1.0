const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

let supabase = null;
let supabaseAdmin = null;

if (!supabaseUrl) {
  console.warn('SUPABASE_URL not set — Supabase clients disabled');
} else {
  try {
    try {
      const parsed = new URL(supabaseUrl);
      console.log('Supabase host:', parsed.hostname);
    } catch (e) {
      console.warn('SUPABASE_URL appears invalid:', supabaseUrl);
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    if (supabaseSecretKey) supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);
  } catch (err) {
    console.error('Failed to initialize Supabase clients:', err && err.message);
    supabase = null;
    supabaseAdmin = null;
  }
}

module.exports = { supabase, supabaseAdmin };
