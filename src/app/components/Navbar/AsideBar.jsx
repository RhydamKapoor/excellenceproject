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

export default function AsideBar() {
  return (
    <Sheet>
      <SheetTrigger>
        <Menu color="#92613a" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className={`max-[400px]:w-5/6 sm:w-1/3 lg:hidden bg-[var(--ourbackground)] gap-y-14`}
      >
        <SheetHeader className={`items-center border border-b-[var(--specialtext)] justify-center !h-[95px]`}>
          <SheetTitle className="text-xl font-semibold capitalize text-[var(--specialtext)] flex items-center">
            Excellence technosoft
          </SheetTitle>
          <SheetDescription className={`text-justify hidden`}>
          </SheetDescription>
        </SheetHeader>
        <Contents />
      </SheetContent>
    </Sheet>
  );
}
