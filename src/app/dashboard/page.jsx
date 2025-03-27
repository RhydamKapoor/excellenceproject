import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  return (
    <div className='flex flex-col justify-between h-full'>
        <div className="flex flex-col justify-center items-center sm:p-20 font-[family-name:var(--font-geist-sans)] h-screen">
            <h1 className="text-3xl font-bold capitalize">Welcome, <span className="text-[var(--specialtext)]">{session?.user?.firstName} {session?.user?.lastName}</span> </h1>
            <p>{session?.user?.role === "USER" ? `Have a look on your today's task!` : (session?.user?.role === "ADMIN" ? `Wanna change the roles?` : `Assign any task to your users`)}</p>
        </div>
    </div>
  )
}
