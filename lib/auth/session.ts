import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type AuthSession = typeof auth.$Infer.Session;

export async function getAuthSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(
  callbackPath?: string,
): Promise<AuthSession> {
  const session = await getAuthSession();

  if (!session) {
    const url = callbackPath
      ? `/admin/login?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "/admin/login";
    redirect(url);
  }

  return session;
}
