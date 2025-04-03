import Image from 'next/image';
import Landing from './components/Landing';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <main className="flex w-full h-screen items-center justify-center p-10 landing">
      {/* Left Side - Illustration */}
      <div className="w-1/2 h-3/4 hidden md:flex items-center justify-center relative">
        <Image 
          src="/landingsvg.svg" 
          fill
          sizes='500px'
          alt="Task Manager Illustration" 
          priority
        />
      </div>
      <Landing session={session && session}/>
    </main>
  );
}
