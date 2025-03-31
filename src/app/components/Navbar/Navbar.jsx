"use client";
import Link from "next/link";
import Contents from "./Contents";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {

 
  return (
    <nav className="p-6 px-5 shadow-md">
      <div className="flex lg:justify-between items-center justify-center relative">
        <span className="absolute left-0 cursor-pointer lg:hidden flex items-center">
          <Sheet>
            <SheetTrigger>
                <Menu color="#92613a"/>
            </SheetTrigger>
            <SheetContent side="left" className={`max-[400px]:w-11/12 lg:hidden bg-[var(--ourbackground)] gap-y-14`}>
              <SheetHeader className={`items-center`}>
                <SheetTitle className="text-xl font-semibold capitalize text-[var(--specialtext)]">
                    Excellence technosoft
                </SheetTitle>
                <SheetDescription className={`text-justify`}>
                  Quick access to your dashboard, tasks, and more
                </SheetDescription>
              </SheetHeader>
              <Contents />
            </SheetContent>
          </Sheet>
        </span>
        
        <div className="flex capitalize">
          <Link href={`/dashboard`}>
            <h1 className="text-xl font-semibold text-[var(--specialtext)]">
              Excellence technosoft
            </h1>
          </Link>
        </div>
        <div className="lg:flex hidden">
          <Contents />
        </div>
      </div>
    </nav>
  );
}
