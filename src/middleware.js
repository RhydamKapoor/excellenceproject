import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ token, req }) => {
      if (!token) return false;
    
      const path = req.nextUrl.pathname;
    
      const allowedRoutes = token.allowedRoutes || [];
    
      return allowedRoutes.some(route => path.startsWith(route));
    }}
  });

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
  ],
};