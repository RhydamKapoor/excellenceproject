import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // ✅ Allow public access to "/"
  if (path === "/") return NextResponse.next();

  // ✅ Redirect to login if not authenticated
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const role = token.role;
  if (!role) return NextResponse.redirect(new URL("/dashboard", req.url));

  // ✅ Define role-based routes
  const roleBasedRoutes = {
    ADMIN: "/dashboard/admin",
    MANAGER: "/dashboard/manager",
    USER: "/dashboard/user",
  };

  // ✅ Everyone can access "/dashboard"
  if (path === "/dashboard") return NextResponse.next();
  if (path === "/dashboard/editprofile") return NextResponse.next();

  // ✅ If user is in the correct role-based path, allow access
  if (path.startsWith(roleBasedRoutes[role])) return NextResponse.next();

  // ❌ Redirect unauthorized users to "/dashboard"
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
