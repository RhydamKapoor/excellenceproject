"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowRightLeft, ClipboardPen } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/context/RoleContext";
// import { signIn, signOut } from "next-auth/react";

export default function ChangeRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { roleOption: "changeRole" },
  });
  const { roleUpdated, setRoleUpdated } = useRole();
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const toastId = toast.loading(`Fetching...`);
    try {
      const { data } = await axios.get("/api/admin/get-users");
      toast.success(`Have a look!`, { id: toastId });
      console.log(data);
      setRoleUpdated(!roleUpdated);
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users", {
        id: toastId,
      });
    }
  };

  const updateRole = async (userId, newRole) => {
    setLoading(true);
    const toastId = toast.loading(`Changing role...`);
    try {
      await axios.post("/api/admin/update-role", { userId, newRole });

      toast.success("Role updated successfully", { id: toastId });
      setRoleUpdated(!roleUpdated);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating role", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const swapRole = async(currentRole, currentUser, selectedEmployee) => {
    const toastId = toast.loading(`Swapping roles...`);
    const changedRole = currentRole === "USER" ? "MANAGER" : "USER";
    try {
      // updateRole(currentUser, roleName);

      const res = await axios.post("/api/admin/swap-role", {currentUser, selectedEmployee, changedRole });
      if(res.status === 200){
          // await signOut({ redirect: false });
          // await signIn();
          toast.success("Role swapped successfully", { id: toastId });

          setRoleUpdated(!roleUpdated);
          fetchUsers();
        }else{
          toast.error("Error swapping roles", { id: toastId });
      }
    } catch (error) {
      toast.error(`Api error`, { id: toastId })
    }
  }

  return (
    <div className="flex flex-col p-5 gap-y-10">
      <div className="flex justify-center">
        <h2 className="text-2xl font-semibold text-[var(--lightText)]">
          Manage Roles
        </h2>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-y-7 w-full">
          <ul className="flex w-full font-bold text-lg text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
            <li className="w-1/4">Name</li>
            <li className="w-1/4">Email</li>
            <li className="w-1/4">Role</li>
            <li className="w-1/4">Action</li>
          </ul>
          <div className="flex flex-col gap-y-3 text-sm">
            {users?.map(
              (user, i) =>
                user.role !== "ADMIN" && (
                  <ul
                    className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full"
                    key={user.id}
                  >
                    <li className="w-1/4 capitalize">
                      {user.firstName} {user.lastName}
                    </li>
                    <li className="w-1/4">{user.email}</li>
                    <li className="w-1/4 capitalize">
                      {user.role.toLowerCase()}
                    </li>
                    <li className="w-1/4">
                      <span className="flex *:w-1/3 gap-x-6 justify-center items-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1 bg-[var(--dark-btn)] rounded-full text-white cursor-pointer flex items-center justify-center gap-x-1">
                              <ClipboardPen size={18} strokeWidth={1.5} />
                              Assign role
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={`justify-items-center gap-y-8`}>
                            
                            <AlertDialogHeader
                              className={`items-center gap-y-2`}
                            >
                              <AlertDialogTitle
                                className={`text-[var(--specialtext)] capitalize text-xl`}
                              >
                                Assign role
                              </AlertDialogTitle>
                              <div className="flex flex-col gap-y-3 py-3">
                                <div className="flex justify-center gap-x-6 w-full text-slate-600">
                                  <div className="flex gap-x-3 select-none">
                                    <label
                                      htmlFor="changeRole"
                                      className=" cursor-pointer"
                                    >
                                      Change role
                                    </label>
                                    <input
                                      type="radio"
                                      name="role"
                                      id="changeRole"
                                      value={"changeRole"}
                                      {...register("roleOption")}
                                    />
                                  </div>
                                  <div className="flex gap-x-3">
                                    <label
                                      htmlFor="swapRole"
                                      className=" cursor-pointer"
                                    >
                                      Swap roles
                                    </label>
                                    <input
                                      type="radio"
                                      name="role"
                                      id="swapRole"
                                      value={"swapRole"}
                                      {...register("roleOption")}
                                    />
                                  </div>
                                </div>
                                <AlertDialogDescription
                                  className={`text-center text-slate-400`}
                                >
                                  {user.role === "USER" ? (watch("roleOption") === "changeRole"
                                    ? `Changing a user's role will remove their assigned tasks.`
                                    : `When swapping roles, the user's tasks will be reassigned to the selected manager.`) : 
                                    (watch("roleOption") === "changeRole" ? `Changing roles may affect existing assignments.` : `Swapping roles will reassign their tasks accordingly.`)
                                  }
                                </AlertDialogDescription>
                              </div>
                            </AlertDialogHeader>
                            

                              {watch('roleOption') === "swapRole" && 
                              <div className="flex flex-col items-center justify-center gap-y-1 w-full">
                                <div className="flex justify-center items-center gap-x-4 text-slate-700 w-full">
                                  <label htmlFor="selectUser" className="text-sm">
                                    Swap role with -
                                  </label>
                                  <Select
                                    
                                    onValueChange={(value) =>
                                      setValue("employeeId", value)
                                    }
                                  >
                                    <SelectTrigger id='selectUser' className="cursor-pointer shadow-none w-1/3 border-b px-3 text-sm text-[var(--withdarkinnertext)] capitalize">
                                      <SelectValue placeholder="Names" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup className="capitalize">
                                        {
                                          user.role === "MANAGER" ?
                                          (users
                                          .filter((u) => u.role === "USER")
                                          .map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                              {u.firstName + " " + u.lastName}
                                            </SelectItem>
                                          ))) : 
                                          (users
                                          .filter((u) => u.role === "MANAGER")
                                          .map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                              {u.firstName + " " + u.lastName}
                                            </SelectItem>
                                          )))
                                        }
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <p className="text-slate-400 text-sm">{user.role === "USER" ? `Selected manager will be a new user!` : `Selected user will be a new manager!`}</p>
                              </div>
                              }

                            <AlertDialogFooter
                              className={`flex justify-center gap-x-6 *:w-1/3 items-center *:cursor-pointer w-full`}
                            >
                              <AlertDialogCancel className={` cursor-pointer`}>
                                Cancel
                              </AlertDialogCancel>
                              {
                                watch('roleOption') === "changeRole" ? 
                                <AlertDialogAction
                                className={`bg-[var(--dark-btn)]/80 hover:bg-[var(--dark-btn)]`}
                                onClick={() =>
                                  updateRole(
                                    user.id,
                                    user.role === "USER" ? "MANAGER" : "USER"
                                  )
                                }
                                >
                                  Change role
                                </AlertDialogAction>
                                :
                                <AlertDialogAction
                                className={`bg-[var(--dark-btn)]/80 hover:bg-[var(--dark-btn)]`}
                                onClick={() =>
                                  swapRole(
                                    user.role,
                                    user.id,
                                    watch('employeeId')
                                  )
                                }
                                >
                                  Swap roles
                                </AlertDialogAction>
                              }
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </span>
                    </li>
                  </ul>
                )
            )}
          </div>
        </div>
      </div>

      {/* <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="text-center">
              <td className="border p-2">
                {user.firstName} {user.lastName}
              </td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">
                {user.role !== "ADMIN" && (
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                    onClick={() =>
                      updateRole(
                        user._id,
                        user.role === "USER" ? "MANAGER" : "USER"
                      )
                    }
                    disabled={loading}
                  >
                    {user.role === "USER" ? "Make Manager" : "Make User"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
}
