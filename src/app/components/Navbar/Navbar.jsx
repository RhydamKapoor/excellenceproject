"use client";

import Link from "next/link";
import NavLinks from "./NavLinks";
import ProfileMenu from "./ProfileMenu";
import AsideBar from "./AsideBar";
import ThemeToggle from "@/components/ThemeToggle";
import { LayoutDashboard } from "lucide-react";
import { APP_NAME } from "@/lib/appConfig";

export default function Navbar() {
  return (
    <header className="glass-nav sticky top-0 z-50 w-full max-w-full overflow-hidden py-3">
      <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
        {/* Left — mobile menu + logo */}
        <div className="col-start-1 row-start-1 flex min-w-0 items-center justify-self-start gap-1.5 sm:gap-2 md:gap-3">
          <div className="shrink-0 lg:hidden">
            <AsideBar />
          </div>
          <Link
            href="/dashboard"
            className="group flex min-w-0 max-w-full cursor-pointer items-center gap-2 transition-opacity duration-200 hover:opacity-90"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-9">
              <LayoutDashboard className="size-4 sm:size-5" />
            </span>
            <span className="truncate text-base font-bold tracking-tight gradient-text sm:text-lg md:text-xl">
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Center — role nav links (desktop only) */}
        <div className="col-start-2 row-start-1 hidden min-w-0 max-w-full justify-self-center overflow-hidden lg:block">
          <NavLinks />
        </div>

        {/* Right — profile + theme */}
        <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-self-end gap-1 sm:gap-1.5 md:gap-2 lg:col-start-3">
          <div className="hidden min-w-0 lg:block">
            <ProfileMenu />
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
