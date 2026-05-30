import Image from "next/image";
import Landing from "./components/Landing";
import { getAppSession } from "@/lib/auth";

export default async function Home() {
  const session = await getAppSession();

  return (
    <main className="landing flex min-h-screen w-full flex-col items-center justify-center p-6 md:flex-row md:p-10 lg:gap-8">
      <div className="relative hidden h-[420px] w-full max-w-lg md:flex md:h-[520px] md:w-1/2 md:items-center md:justify-center">
        <div className="card-surface absolute inset-4 rounded-3xl bg-gradient-to-br from-primary/5 to-violet-500/5" />
        <Image
          src="/landingsvg.svg"
          fill
          sizes="500px"
          alt="Task Manager Illustration"
          priority
          className="object-contain p-8 transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
      <Landing session={session} />
    </main>
  );
}
