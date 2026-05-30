import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, ctx) {
  const handler = NextAuth(authOptions);
  return handler(req, ctx);
}

export async function POST(req, ctx) {
  const handler = NextAuth(authOptions);
  return handler(req, ctx);
}
