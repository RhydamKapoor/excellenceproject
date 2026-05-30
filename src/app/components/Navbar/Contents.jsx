"use client";

import NavLinks from "./NavLinks";
import ProfileMenu from "./ProfileMenu";

/** Mobile drawer navigation */
export default function Contents({ setOpen }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <section>
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        <NavLinks setOpen={setOpen} mobile />
      </section>

      <section className="mt-auto border-t border-border pt-4">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <ProfileMenu setOpen={setOpen} mobile />
      </section>
    </div>
  );
}
