import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Synchronizes authentication session state with Next.js request cookies.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local"
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      // Backwards compatibility for earlier @supabase/ssr versions
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {}
      },
    },
  });
}

/**
 * Creates an administrative / service-role Supabase client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS)
 * for administrative functions like verifying payments, approving sellers, and managing users.
 *
 * NEVER expose this client to the browser.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createAdminClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in server environment variables."
    );
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
      get() {
        return null;
      },
      set() {},
      remove() {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default createClient;

