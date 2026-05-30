"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowRight, CheckCircle2, Sparkles, Users, LayoutDashboard } from "lucide-react";

export default function Landing({ session }) {
  const features = [
    { icon: LayoutDashboard, text: "Role-based dashboards" },
    { icon: Users, text: "Team task assignment" },
    { icon: CheckCircle2, text: "Real-time task tracking" },
  ];

  return (
    <div className="relative flex w-full flex-col items-center gap-10 p-6 text-center md:w-1/2 md:p-10 lg:items-start lg:text-left">
      <div className="absolute right-0 top-0 md:right-4">
        <ThemeToggle />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground lg:self-start">
          <Sparkles className="size-3.5 text-primary" />
          Smart task management platform
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground max-[400px]:text-3xl md:text-5xl">
          Manage tasks with{" "}
          <span className="gradient-text">clarity</span> and confidence
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground max-[400px]:text-sm lg:mx-0">
          Assign work, track progress, and collaborate with your team — all in one professional workspace.
        </p>
      </div>

      <ul className="flex flex-col gap-3 self-center lg:self-start">
        {features.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            {text}
          </li>
        ))}
      </ul>

      <div className="flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
        {session ? (
          <Link href="/dashboard" className="btn-primary group w-full sm:w-auto">
            Go to dashboard
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn-primary w-full sm:w-auto">
              Sign in
            </Link>
            <Link href="/signup" className="btn-outline-brand w-full sm:w-auto">
              Create account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
