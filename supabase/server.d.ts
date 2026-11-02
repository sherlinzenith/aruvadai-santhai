import { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient;
export function createAdminClient(): SupabaseClient;
export default createClient;

