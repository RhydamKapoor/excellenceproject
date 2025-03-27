'use client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link'

export default function Navbar() {
    const { data: session } = useSession();
  return (
    <nav className='p-6 px-5 shadow-md'>
      <div className="flex justify-between">
        <div className="flex capitalize">
        <Link href={`/dashboard`}>
            <h1 className='text-xl font-semibold text-[var(--specialtext)]'>Excellence technosoft</h1>
        </Link>
        </div>
        <div className="flex">
            <div className="flex">
                <ul className='flex gap-x-5'>
                    {session?.user?.role === 'USER' && <Link href={`/dashboard/user/task`} className='capitalize'>Tasks</Link>}
                    {session?.user?.role === 'ADMIN' && <Link href={`/dashboard/admin/workers`} className='capitalize'>Manage roles</Link>}
                    {session?.user?.role === 'MANAGER' && <Link href={`/dashboard/manager/assigntask`} className='capitalize'>Assign task</Link>}
                    <li className='cursor-pointer'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <span className='capitalize'>Profile</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel className={`capitalize`}>Hey, {session?.user?.firstName} {session?.user?.lastName}! ({session?.user?.role})</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className={`cursor-pointer`} onClick={() => signOut()}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </nav>
  )
}
