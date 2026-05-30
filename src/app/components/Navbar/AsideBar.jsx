"use client";

import Contents from "./Contents";
import { LayoutDashboard, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { APP_NAME } from "@/lib/appConfig";

const ROLE_LABELS = {
  USER: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

export default function AsideBar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors duration-200 hover:bg-accent">
        <Menu className="size-5 text-primary" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(300px,88vw)] flex-col gap-0 border-border bg-background p-0 [&>button]:top-5 [&>button]:right-4 [&>button]:rounded-lg [&>button]:border [&>button]:border-border [&>button]:bg-card [&>button]:p-2 [&>button]:opacity-100"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-border px-5 pb-5 pt-6">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-violet-500/6" />
          <Link
            href="/dashboard"
            onClick={close}
            className="relative flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
              <LayoutDashboard className="size-5" />
            </span>
            <div className="min-w-0 pr-8">
              <SheetTitle className="gradient-text text-left text-xl font-bold leading-tight">
                {APP_NAME}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">Manage tasks smarter</p>
            </div>
          </Link>
        </div>

        {/* User card */}
        {session?.user && (
          <div className="shrink-0 px-4 pt-4">
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                  {session.user.firstName?.[0]}
                  {session.user.lastName?.[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold capitalize text-foreground">
                    {session.user.firstName} {session.user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <span className="mt-2.5 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                {ROLE_LABELS[session.user.role] ?? session.user.role}
              </span>
            </div>
          </div>
        )}

        {/* Nav + account */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          <Contents setOpen={setOpen} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
