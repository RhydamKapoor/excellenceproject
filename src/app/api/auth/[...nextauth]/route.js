import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/db";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
        //   await connectDB();

          const user = await prisma.user.findUnique({where: { email: credentials.email }});

          if (!user) {
            throw new Error("User not found");
          }
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log("Invalid credentials");
            throw new Error("Invalid credentials");
          }

          console.log("Authentication successful!");

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            allowedRoutes: user.role === "ADMIN" ? ["/", "/dashboard/admin/*", "/dashboard"] : user.role === "USER" ? ["/", "/dashboard", "/dashboard/user/*"] : ['/', '/dashboard', '/dashboard/manager/*'],
          };
        } catch (error) {
          console.error("Error in authorize:", error.message);
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.allowedRoutes = user.allowedRoutes;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.allowedRoutes = token.allowedRoutes;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
