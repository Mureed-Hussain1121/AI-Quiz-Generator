import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Block disabled users from accessing any protected route
    if (token && !token.id) {
      return NextResponse.redirect(new URL("/login?error=account_disabled", req.url));
    }

    // Admin-only routes
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true = allow, false = redirect to signIn page
      authorized: ({ token }) => !!token,
    },
  }
);

// Apply middleware to these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/quiz/:path*",
    "/account/:path*",
    "/admin/:path*",
  ],
};
