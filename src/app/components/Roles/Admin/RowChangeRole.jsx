import { ClipboardPen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RowChangeRole({user, users, updateRole, setValue}) {
  return (
    <ul
    className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full"
  >
    <li className="w-1/4 capitalize">{user.firstName} {user.lastName}</li>
    <li className="w-1/4">{user.email}</li>
    <li className="w-1/4 capitalize">{user?.role?.toLowerCase()}</li>
    <li className="w-1/4">
      <span className="flex w-full gap-x-6 justify-center items-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1 bg-[var(--dark-btn)] rounded-full text-white cursor-pointer flex w-1/2 max-lg:w-2/3 max-md:w-full items-center justify-center gap-x-1">
              <ClipboardPen size={18} strokeWidth={1.5} />
              Change role
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className={`justify-items-center gap-y-8`}>
            <AlertDialogHeader className={`items-center gap-y-2`}>
              <AlertDialogTitle className={`text-[var(--specialtext)] capitalize text-xl`}>
                Change role
              </AlertDialogTitle>
              {user.role === "USER" ? (
                <AlertDialogDescription>
                  You are promoting the user to manager!
                </AlertDialogDescription>
              ) : (
                <AlertDialogDescription className={`hidden`}></AlertDialogDescription>
              )}
            </AlertDialogHeader>

            {user.role === "MANAGER" && (
              <div className="flex flex-col gap-y-3 w-full items-center ">
                <Select onValueChange={(value) => setValue("employeeId", value)}>
                  <SelectTrigger className="cursor-pointer w-1/2 py-1 text-center rounded-md border border-orange-700 text-sm text-[var(--withdarkinnertext)] capitalize">
                    <SelectValue placeholder="Employees" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="center">
                    <SelectGroup className="capitalize">
                      <SelectLabel className={`text-[var(--specialtext)] text-base font-bold`}>Users</SelectLabel>
                      {users
                        .filter((detail) => detail.role === "USER")
                        .map((detail) => (
                          <SelectItem key={detail.id} value={detail.id} className={`cursor-pointer capitalize flex gap-x-2 text-sm text-slate-600`}>
                            {detail.firstName + " " + detail.lastName}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup className="capitalize">
                      <SelectLabel className={`text-[var(--specialtext)] text-base font-bold`}>Managers</SelectLabel>
                      {users
                        .filter((detail) => detail.role === "MANAGER" && detail.id !== user.id)
                        .map((detail) => (
                          <SelectItem key={detail.id} value={detail.id} className={`cursor-pointer capitalize flex gap-x-2 text-sm text-slate-600`}>
                            {detail.firstName + " " + detail.lastName}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 w-2/3 text-center">Selected employee will take place of this manager</p>
              </div>
            )}

            <AlertDialogFooter className={`flex min-[450px]:flex-row justify-center gap-x-6 *:w-1/3 max-[450px]:*:w-full items-center *:cursor-pointer w-full`}>
              <AlertDialogCancel className={` cursor-pointer`}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={`bg-[var(--dark-btn)]/80 hover:bg-[var(--dark-btn)]`}
                onClick={() => updateRole(user.id, user.role === "USER" ? "MANAGER" : "USER")}
              >
                Change role
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
    </li>
  </ul>
  )
}
