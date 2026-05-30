import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { LayoutDashboard } from "lucide-react";
import { APP_NAME } from "@/lib/appConfig";

export default function AuthLayout({
  title,
  subtitle,
  illustrationSrc,
  illustrationAlt,
  illustrationFirst = false,
  children,
}) {
  const illustrationPanel = (
    <div className="relative hidden h-full overflow-hidden lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-violet-500/[0.06]" />
      <div className="pointer-events-none absolute -left-24 top-[15%] size-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-[10%] size-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-12 xl:px-16">
        <div className="relative w-full max-w-md xl:max-w-lg">
          <Image
            src={illustrationSrc}
            alt={illustrationAlt}
            width={560}
            height={560}
            priority
            className="h-auto w-full max-h-[min(58vh,520px)] object-contain drop-shadow-sm"
          />
        </div>
        <p className="mt-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
          Streamline tasks, collaborate with your team, and stay productive with {APP_NAME}.
        </p>
      </div>
    </div>
  );

  const formPanel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-5 sm:px-8 sm:py-6">
      <div className="flex shrink-0 items-center justify-between">
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="size-5" />
          </span>
          <span className="text-lg font-bold gradient-text">{APP_NAME}</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 text-center lg:mb-5 lg:text-left">
            <h1 className="page-header text-2xl md:text-3xl">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <main className="grid h-screen max-h-screen overflow-hidden bg-background lg:grid-cols-2">
      {illustrationFirst ? (
        <>
          {illustrationPanel}
          {formPanel}
        </>
      ) : (
        <>
          {formPanel}
          {illustrationPanel}
        </>
      )}
    </main>
  );
}
