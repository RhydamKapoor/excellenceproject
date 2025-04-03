import Contents from "./Contents";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export default function AsideBar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={() => setOpen(!open)}>
      <SheetTrigger className="cursor-pointer">
        <Menu color="#92613a" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className={`w-4/12 max-md:w-5/12 max-sm:w-6/12 max-[500px]:!w-10/12 lg:hidden bg-[var(--ourbackground)] gap-y-14`}
      >
        <SheetHeader className={`items-center border border-b-[var(--specialtext)] justify-center !h-[95px]`}>
          <SheetTitle className="text-xl font-semibold capitalize text-[var(--specialtext)] flex items-center">
            Excellence technosoft
          </SheetTitle>
          <SheetDescription className={`text-justify hidden`}>
          </SheetDescription>
        </SheetHeader>
        <Contents setOpen={setOpen} />
      </SheetContent>
    </Sheet>
  );
}
