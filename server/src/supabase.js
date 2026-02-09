const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Client anonyme (pour les requêtes côté client)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client admin (pour les opérations sensibles côté serveur)
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

module.exports = { supabase, supabaseAdmin };
