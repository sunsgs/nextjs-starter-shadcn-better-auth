// proxy.ts (root folder)
import { getUsersCount } from "@/lib/actions/admin/user-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Step 1 — check if any users exist (fast Drizzle query, no auth)
  const usersCount = await getUsersCount();
  const noUsers = usersCount === 0;

  // Step 2 — no users: funnel everything to /admin/users for first setup
  if (noUsers) {
    if (pathname === "/admin/users") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }

  // Step 3 — users exist: /admin/users and /admin/login are public
  const PUBLIC_PATHS = ["/admin/login"];
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Step 4 — validate session for all other /admin/* routes
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
