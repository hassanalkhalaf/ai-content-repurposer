import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use on the server (Server Components, API routes)
 * that respects the signed-in user's session via cookies, and RLS policies.
 * NOT an admin client — use lib/supabase-admin.ts for privileged operations.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore if you have
            // middleware refreshing sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}
