"use client";

import { ListOrdered, ListTodo, Repeat2Icon, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    role: "USER",
    links: [{ icon: ListTodo, label: "Tasks", href: "/dashboard/user/task" }],
  },
  {
    role: "ADMIN",
    links: [
      { icon: UserRound, label: "Assign employees", href: "/dashboard/admin/assignusers" },
      { icon: Repeat2Icon, label: "Manage roles", href: "/dashboard/admin/manageroles" },
    ],
  },
  {
    role: "MANAGER",
    links: [{ icon: ListOrdered, label: "Assign task", href: "/dashboard/manager/assigntask" }],
  },
];

export default function NavLinks({ setOpen, mobile = false }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const changeRoute = () => {
    if (mobile && setOpen) setOpen(false);
  };

  const isActive = (href) => pathname.startsWith(href);

  return (
    <ul
      className={
        mobile
          ? "flex flex-col gap-1.5"
          : "flex min-w-0 max-w-full items-center justify-center gap-2 font-medium"
      }
    >
      {menuItems.map(
        ({ role, links }) =>
          session?.user?.role === role &&
          links.map(({ icon: Icon, label, href }) => (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                title={label}
                onClick={changeRoute}
                className={
                  mobile
                    ? `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                        isActive(href)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-muted"
                      }`
                    : `nav-link max-w-full cursor-pointer capitalize px-2 py-1.5 text-xs 2xl:px-3 2xl:py-2 2xl:text-sm ${
                        isActive(href)
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                }
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-lg ${
                    mobile
                      ? isActive(href)
                        ? "bg-primary-foreground/15"
                        : "bg-muted"
                      : ""
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                </span>
                <span className={mobile ? "truncate" : "hidden truncate 2xl:inline"}>
                  {label}
                </span>
              </Link>
            </li>
          ))
      )}
    </ul>
  );
}
