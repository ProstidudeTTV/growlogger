import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Create a Supabase client instance
export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey
);

// Helper function to set the Discord user ID for RLS policies
export async function setDiscordUserId(userId: string): Promise<void> {
  // Set a custom setting that can be used in RLS policies
  // Note: This requires using service role key or a custom function
  // For now, we'll query directly with service role key which bypasses RLS
}
