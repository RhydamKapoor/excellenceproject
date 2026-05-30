import NextAuthModule from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NextAuth = NextAuthModule.default ?? NextAuthModule;
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
