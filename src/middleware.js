import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;
  
  // console.log("Requested Path:", path);

  // ✅ Public access for home, login, and signup pages
  if (path === "/" || path === "/login" || path === "/signup") return NextResponse.next();

  // ✅ Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // ✅ Redirect logged-in users away from login/signup
  if (path === "/login" || path === "/signup") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  const role = token.role;
  // console.log(role);
  
  if (!role) return NextResponse.redirect(new URL("/login", req.nextUrl.origin));

  // ✅ Define role-based routes
  const roleBasedRoutes = {
    ADMIN: "/dashboard/admin",
    MANAGER: "/dashboard/manager",
    USER: "/dashboard/user",
  };

  // ✅ Everyone can access "/dashboard" and edit profile
  if (path === "/dashboard" || path === "/dashboard/editprofile") return NextResponse.next();

  // ✅ If user is in the correct role-based path, allow access
  if (path.startsWith(roleBasedRoutes[role])) return NextResponse.next();

  // ❌ Redirect unauthorized users to their correct dashboard
  return NextResponse.redirect(new URL(roleBasedRoutes[role], req.nextUrl.origin));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
 