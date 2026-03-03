// lib/auth/session.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Returns the session or null — use when you handle the null case yourself.
 */
export async function getAuthSession(): Promise<AuthSession> {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Returns the session or redirects to /admin/login.
 * Use this at the top of every protected page.
 */
export async function requireSession(
  callbackPath?: string,
): Promise<NonNullable<AuthSession>> {
  const session = await getAuthSession();

  if (!session) {
    const url = callbackPath
      ? `/admin/login?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "/admin/login";
    redirect(url);
  }

  return session;
}
