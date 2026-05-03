import { supabase as client } from '@/integrations/supabase/client';

// Re-export the configured client to ensure all existing imports work correctly
export const supabase = client;