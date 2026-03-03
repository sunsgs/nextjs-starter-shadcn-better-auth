import { getUsersCount } from "@/lib/actions/admin/user-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const usersCount = await getUsersCount();
  const noUsers = usersCount === 0;

  if (noUsers) {
    if (pathname === "/admin/setup") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/setup", request.url));
  }
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
