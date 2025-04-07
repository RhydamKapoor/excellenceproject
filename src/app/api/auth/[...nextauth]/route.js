import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/db";
import GoogleProvider from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.real_name,
          email: profile.email,  // sometimes profile.user.email depending on scopes
          image: profile.image_512, 
        };
      },
    }),
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
      console.log(`
        user: ${JSON.stringify(user)}
        account: ${JSON.stringify(account)}
        profile: ${JSON.stringify(profile)}
        `);
      
      if (account.provider === "credentials") {
        return true;
      }
      
      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });
        
        if (existingUser) {
          // Update existing user with provider data
          await prisma.user.update({
            where: { email: profile.email },
            data: {
              providerId: account.providerAccountId,
              provider: account.provider,
              // For Google
              ...(account.provider === "google" && {
                firstName: profile.given_name || profile.name.split(" ")[0],
                lastName: profile.family_name || profile.name.split(" ").slice(1).join(" "),
                image: profile.picture,
              }),
              // For Slack
              ...(account.provider === "slack" && {
                firstName: profile.name.split(" ")[0],
                lastName: profile.name.split(" ").slice(1).join(" "),
                image: profile.image_192 || profile.image_original,
              }),
            },
          });
        } else {
          // Create new user with provider data
          await prisma.user.create({
            data: {
              email: profile.email,
              provider: account.provider,
              providerId: account.providerAccountId,
              // For Google
              ...(account.provider === "google" && {
                firstName: profile.given_name || profile.name.split(" ")[0],
                lastName: profile.family_name || profile.name.split(" ").slice(1).join(" "),
                image: profile.picture,
                role: "USER", // Default role
              }),
              // For Slack
              ...(account.provider === "slack" && {
                firstName: profile.name.split(" ")[0],
                lastName: profile.name.split(" ").slice(1).join(" "),
                image: profile.image_192 || profile.image_original,
                role: "USER", // Default role
              }),
            },
          });
        }
        
        // Also save account info
        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        });
        
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: existingUser?.id || user.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error saving provider auth data:", error);
        return true; // Still allow sign in even if DB operations fail
      }
    },
    
    async jwt({ token, user, trigger, session, account, profile }) {
      if(trigger === "update"){
        return {...token, ...session.user}
      }
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.createdAt = user.createdAt;
      }
      if (account) {
        token.provider = account.provider; // 'google' or 'slack'
        token.providerId = account.providerAccountId;
    
        if (account.provider === "google") {
          token.picture = profile?.picture; // Google's profile picture
        }
    
        if (account.provider === "slack") {
          token.picture = profile?.image_192; // Slack's profile image (size 192px)
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
        session.user.createdAt = token.createdAt;
        session.user.picture = token.picture;
        session.user.provider = token.provider;
        session.user.providerId = token.providerId;
        
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
