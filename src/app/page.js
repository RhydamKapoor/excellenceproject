import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <div className="flex flex-col gap-y-3 justify-center items-center sm:p-20 font-[family-name:var(--font-geist-sans)] h-screen">
      <h1 className="text-3xl font-bold capitalize">Get Started</h1>
      <Link href={`/dashboard`} className="p-2 bg-[var(--specialtext)] text-white rounded-full w-40 text-center">Let's Explore!</Link>
    </div>
  );
}
