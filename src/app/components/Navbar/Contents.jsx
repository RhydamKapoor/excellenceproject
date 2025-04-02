'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderKanban, ListOrdered, ListTodo, Repeat2Icon, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Contents() {
    const { data: session } = useSession();

    const menuItems = [
        {
          role: "USER",
          links: [
            { icon: <ListTodo size={22}/>, label: "Tasks", href: "/dashboard/user/task" },
            // { label: "Profile", href: "/dashboard/user/profile" }
          ],
        },
        {
          role: "ADMIN",
          links: [
            { icon: <UserRound size={21} />, label: "Assign employees", href: "/dashboard/admin/assignusers" },
            { icon: <Repeat2Icon size={22}/>, label: "Manage roles", href: "/dashboard/admin/manageroles" },
          ],
        },
        {
          role: "MANAGER",
          links: [
            { icon: <ListOrdered size={22}/>, label: "Assign task", href: "/dashboard/manager/assigntask" },
            // { label: "Team Overview", href: "/dashboard/manager/team" },
            // { label: "Team Overview", href: "/dashboard/manager/team" }
          ],
        },
    ];
  return (
    <div className="flex h-full">
      <ul className="flex lg:flex-row items-center flex-col lg:justify-between w-full gap-y-1 gap-x-5 px-6 max-lg:h-full font-semibold text-slate-800 ">
        <div className="flex max-lg:flex-col gap-x-4 gap-y-2 w-full">
          {menuItems.map(
            ({ role, links }) =>
              session?.user?.role === role &&
              links.map(({icon, label, href }, i) => (
                <Link key={i} href={href} className="capitalize lg:text-base text-lg flex rounded-full p-1 max-lg:text-[var(--specialtext)] items-center gap-x-1">
                  {icon} {label}
                </Link>
              ))
          )}
          <li className="cursor-pointer text-md max-lg:text-[var(--specialtext)] p-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="capitalize flex items-center gap-x-1 text-lg"><FolderKanban size={21}/> Profile</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel className={`capitalize flex gap-x-1 font-semibold text-[var(--specialtext)]`}>
                  Hey, {session?.user?.firstName} {session?.user?.lastName}! 
                  <span className="capitalize">({(session?.user?.role)?.toLowerCase()})</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={`cursor-pointer items-center`} asChild>
                  <Link href={`/dashboard/editprofile`}>
                    Your Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer text-red-600`}
                  onClick={() => signOut()}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>

        </div>
      </ul>
    </div>
  );
}
