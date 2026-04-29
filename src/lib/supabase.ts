import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are present and not the literal string "undefined"
const isConfigured = supabaseUrl && supabaseUrl !== 'undefined' && supabaseAnonKey && supabaseAnonKey !== 'undefined';

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isConfigured) {
  console.warn("Supabase credentials missing. Please click 'Rebuild' in the Dyad UI to apply your integration settings.");
}