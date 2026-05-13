import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getInviteCodeFromEnv,
  INVITE_COOKIE_NAME,
  verifyInviteToken,
} from "@/lib/invite-gate";

function isPublicAssetPath(pathname: string): boolean {
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$/i.test(pathname);
}

export async function middleware(request: NextRequest) {
  const inviteCode = getInviteCodeFromEnv();
  if (!inviteCode) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/invite") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/invite") ||
    pathname === "/favicon.ico" ||
    isPublicAssetPath(pathname)
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(INVITE_COOKIE_NAME)?.value;
  if (await verifyInviteToken(inviteCode, cookie)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/invite";
  const from = `${pathname}${request.nextUrl.search}`;
  if (from.startsWith("/") && !from.startsWith("//")) {
    url.searchParams.set("from", from);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
