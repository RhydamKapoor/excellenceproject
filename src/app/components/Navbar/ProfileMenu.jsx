"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProfileMenu({ setOpen, mobile = false }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isProfileActive = pathname.includes("/editprofile");

  const closeMobile = () => {
    if (mobile && setOpen) setOpen(false);
  };

  if (mobile) {
    return (
      <div className="flex flex-col gap-1.5">
        <Link
          href="/dashboard/editprofile"
          onClick={closeMobile}
          className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
            isProfileActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              isProfileActive ? "bg-primary-foreground/15" : "bg-muted"
            }`}
          >
            <UserCircle2 className="size-4" />
          </span>
          Your profile
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <LogOut className="size-4" />
          </span>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-2 text-sm font-medium transition-colors duration-200 hover:bg-accent sm:gap-2 sm:pr-3 ${
            isProfileActive ? "border-primary/40 bg-primary/5 text-primary" : "text-foreground"
          }`}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-8">
            <UserCircle2 className="size-4" />
          </span>
          <span className="hidden max-w-[72px] truncate capitalize xl:inline xl:max-w-[96px]">
            {session?.user?.firstName || "Profile"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
        <DropdownMenuLabel className="rounded-xl px-3 py-2.5">
          <p className="truncate font-semibold capitalize text-foreground">
            {session?.user?.firstName} {session?.user?.lastName}
          </p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {session?.user?.email}
          </p>
          <p className="mt-1 text-xs capitalize text-primary">
            {session?.user?.role?.toLowerCase()}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/editprofile" className="cursor-pointer gap-2">
            <UserCircle2 className="size-4" />
            Your profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-2"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
