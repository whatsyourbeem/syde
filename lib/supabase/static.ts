import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

/**
 * Cookie-free Supabase client for Server Components that render public,
 * cacheable content (e.g. blog/showcase detail pages).
 *
 * `lib/supabase/server.ts` calls `cookies()` on creation, which forces the
 * whole route into dynamic rendering even when the query itself doesn't
 * need the session. This client reads with the anon key only, so RLS
 * still applies (identical to what a logged-out visitor sees), but the
 * page stays eligible for Full Route Cache / ISR.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
