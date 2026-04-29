import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We only initialize the client if the URL is present to avoid the "supabaseUrl is required" error.
// If it's missing, we export a proxy or null, but the Rebuild should fix the underlying issue.
export const supabase = (supabaseUrl && supabaseUrl !== 'undefined') 
  ? createClient(supabaseUrl, supabaseAnonKey || '')
  : null as any;

if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.warn("Supabase credentials missing. If you just added the integration, please click 'Rebuild' in the Dyad UI.");
}