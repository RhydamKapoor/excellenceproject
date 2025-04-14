import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/db";
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60*60*24
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
    }),
    CredentialsProvider({
      async authorize(credentials) {
        try {
          //   await connectDB();

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user) {
            throw new Error("User not found");
          }
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.log("Invalid credentials");
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            provider: user.provider,
            createdAt: user.createdAt,
          };
        } catch (error) {
          console.error("Error in authorize:", error.message);
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {

      if (account?.provider === "google" || account?.provider === "slack") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            console.log("No existing user, creating new one...");
            await prisma.user.create({
              data: {
                email: user.email,
                firstName: user.name ? user.name.split(" ")[0] : "NoName",
                lastName: user.name ? user.name.split(" ")[1] || "" : "NoName",
                image: user.image || null,
                provider: account?.provider || "credentials",
              },
            });
          } else {
            console.log("Existing user found:", existingUser);
          }
        } catch (error) {
          console.error("SignIn Error:", error);
          return false; // AccessDenied
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update") {
        return { ...token, ...session.user };
      }

      if (user) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          token.id = existingUser.id;
          token.firstName = existingUser.firstName;
          token.lastName = existingUser.lastName;
          token.role = existingUser.role;
          token.email = existingUser.email;
          token.createdAt = existingUser.createdAt;
          token.picture = existingUser.image;
          token.provider = existingUser.provider;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.email = token.email;
        session.user.createdAt = token.createdAt;
        session.user.picture = token.picture;
        session.user.provider = token.provider;

        // Combine firstName and lastName to create a name property
        if (token.firstName && token.lastName) {
          session.user.name = `${token.firstName} ${token.lastName}`;
        }
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
