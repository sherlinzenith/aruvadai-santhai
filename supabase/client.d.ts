import { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient;
export function getClient(): SupabaseClient;
export default createClient;

