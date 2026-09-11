/**
 * Optional Supabase client. Prefer when NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are present; otherwise callers fall back to Prisma.
 * We avoid a hard dependency on @supabase/supabase-js so the demo builds without it.
 */

export type SupabaseLike = {
  from: (table: string) => {
    select: (cols?: string) => Promise<{ data: unknown; error: unknown }>;
  };
};

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Returns null unless env vars are set. Callers should use Prisma when null.
 * Dynamic import keeps the build working without the package installed.
 */
export async function getSupabaseClient(): Promise<SupabaseLike | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    // Optional peer — only used when credentials are configured.
    const mod = await import(
      /* webpackIgnore: true */ "@supabase/supabase-js" as string
    ).catch(() => null);
    if (!mod?.createClient) return null;
    return mod.createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) as SupabaseLike;
  } catch {
    return null;
  }
}
