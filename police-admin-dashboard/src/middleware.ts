import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("authToken");
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/login"];

  if (!authToken && !publicRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authToken && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}; 