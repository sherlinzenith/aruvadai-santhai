import { createBrowserClient } from "@supabase/ssr";

/**
 * Normalizes the Supabase URL by removing any trailing slashes or /rest/v1 suffixes.
 * @param {string | undefined} url
 * @returns {string}
 */
function sanitizeSupabaseUrl(url) {
  if (!url) return "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Creates a Supabase client for use in browser environments (Client Components).
 * Manages auth session storage in cookies automatically via @supabase/ssr.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Default pre-instantiated client instance for convenience
let browserClientInstance = null;

export function getClient() {
  if (typeof window === "undefined") {
    return createClient();
  }
  if (!browserClientInstance) {
    browserClientInstance = createClient();
  }
  return browserClientInstance;
}

export default createClient;

