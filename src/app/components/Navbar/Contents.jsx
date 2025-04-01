'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Contents() {
    const { data: session } = useSession();

    const menuItems = [
        {
          role: "USER",
          links: [
            { label: "Tasks", href: "/dashboard/user/task" },
            // { label: "Profile", href: "/dashboard/user/profile" }
          ],
        },
        {
          role: "ADMIN",
          links: [
            // { label: "Assign users", href: "/dashboard/admin/assignusers" },
            { label: "Manage roles", href: "/dashboard/admin/manageroles" },
          ],
        },
        {
          role: "MANAGER",
          links: [
            { label: "Assign task", href: "/dashboard/manager/assigntask" },
            // { label: "Team Overview", href: "/dashboard/manager/team" },
            // { label: "Team Overview", href: "/dashboard/manager/team" }
          ],
        },
    ];
  return (
    <div className="flex">
      <ul className="flex lg:flex-row lg:items-center flex-col lg:justify-between w-full gap-y-1 gap-x-5 px-6 h-full font-semibold text-slate-800">
        {menuItems.map(
          ({ role, links }) =>
            session?.user?.role === role &&
            links.map(({ label, href }, i) => (
              <Link key={i} href={href} className="capitalize lg:text-base text-lg max-lg:w-3/5 flex rounded-full p-1 max-lg:text-[var(--specialtext)] ">
                {label}
              </Link>
            ))
        )}
        <li className="cursor-pointer text-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="capitalize">Profile</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className={`capitalize`}>
                Hey, {session?.user?.firstName} {session?.user?.lastName}! (
                {session?.user?.role})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={`cursor-pointer items-center`} asChild>
                <Link href={`/dashboard/editprofile`}>
                  Your Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`cursor-pointer`}
                onClick={() => signOut()}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </div>
  );
}
