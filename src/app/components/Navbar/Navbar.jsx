"use client";
import Link from "next/link";
import Contents from "./Contents";
import AsideBar from "./AsideBar";

export default function Navbar() {

 
  return (
    <nav className="py-2 px-5 shadow-md">
      <div className="flex lg:justify-between items-center justify-center relative h-[64px]">
        <span className="absolute left-0 cursor-pointer lg:hidden flex items-center">
          <AsideBar />
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
