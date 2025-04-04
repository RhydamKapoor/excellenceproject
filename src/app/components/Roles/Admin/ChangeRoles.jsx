"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRole } from "@/context/RoleContext";
import RowChangeRole from "./RowChangeRole";
// import { signIn, signOut } from "next-auth/react";

export default function ChangeRoles() {
  const [users, setUsers] = useState([]);
  const { watch, setValue } = useForm({
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
      setRoleUpdated(!roleUpdated);
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users", {
        id: toastId,
      });
    }
  };

  const updateRole = async (userId, newRole) => {
    const employeeId = watch("employeeId");
    if (newRole === "USER" && !employeeId) {
      toast("Please select an employee!", {icon: '⚠️'});
      return;
    }
    const toastId = toast.loading(`Changing role...`);
    try {
      if(newRole === "MANAGER"){
        await axios.post("/api/admin/update-role", { userId, newRole });
      }else{
        await axios.post("/api/admin/update-role", { userId, newRole, employeeId });
      }

      toast.success("Role updated successfully", { id: toastId });
      setValue("employeeId", "")
      setRoleUpdated(!roleUpdated);
      fetchUsers();
    } catch (error) {
      setValue("employeeId", "")
      toast.error(error.response?.data?.error || "Error updating role", {
        id: toastId,
      });
    }
  };
  

  return (
    <div className="flex flex-col p-5 gap-y-10">
      <div className="flex justify-center">
        <h2 className="text-2xl font-semibold text-[var(--lightText)]">
          Manage Roles
        </h2>
      </div>
      <div className="flex flex-col overflow-x-auto">
        <div className="flex flex-col gap-y-7 w-full min-w-[580px]">
          <ul className="flex w-full font-bold text-lg text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
            <li className="w-1/4">Name</li>
            <li className="w-1/4">Email</li>
            <li className="w-1/4">Role</li>
            <li className="w-1/4">Action</li>
          </ul>
          <div className="flex flex-col gap-y-3 text-sm">
          {users && (
            <>
              {/* First render all USER roles */}
              {users
                .filter((user) => user.role === "USER")
                .map((user) => (
                  <RowChangeRole key={user.id} user={user} users={users} updateRole={updateRole} setValue={setValue}/>
                ))}

              {/* Then render all MANAGER roles */}
              {users
                .filter((user) => user.role === "MANAGER")
                .map((user) => (
                  <RowChangeRole key={user.id} user={user} users={users} updateRole={updateRole} setValue={setValue}/>
                ))}
            </>
          )}
            {/* {users?.map(
              (user, i) =>
                (user.role !== "ADMIN" && user.role === "USER") && (
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
                      <span className="flex w-full gap-x-6 justify-center items-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1 bg-[var(--dark-btn)] rounded-full text-white cursor-pointer flex w-1/2 max-lg:w-2/3 max-md:w-full items-center justify-center gap-x-1">
                              <ClipboardPen size={18} strokeWidth={1.5} />
                              Change role
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={`justify-items-center gap-y-8`}>
                            
                            <AlertDialogHeader
                              className={`items-center gap-y-2`}
                            >
                              <AlertDialogTitle
                                className={`text-[var(--specialtext)] capitalize text-xl`}
                              >
                                Change role
                              </AlertDialogTitle>
                              {
                              user.role === "USER" ?
                              <AlertDialogDescription>
                                You are promoting the user to manager!
                              </AlertDialogDescription> :
                              <AlertDialogDescription className={`hidden`}></AlertDialogDescription>
                              }
                            </AlertDialogHeader>
                            {
                              user.role === "MANAGER" &&
                              <div className="flex flex-col gap-y-3 w-full items-center ">
                                <Select 
                                  onValueChange={(value) => setValue("employeeId", value)}
                                >
                                  <SelectTrigger className="cursor-pointer w-1/2 py-1 text-center rounded-md border border-orange-700 text-sm text-[var(--withdarkinnertext)] capitalize">
                                    <SelectValue placeholder="Employees" />
                                  </SelectTrigger>
                                  <SelectContent side="bottom" align="center">
                                    <SelectGroup className="capitalize">
                                      <SelectLabel className={`text-[var(--specialtext)] text-base font-bold`}>Users</SelectLabel>
                                    {
                                      users.map((detail) => (
                                        (detail.role !== "ADMIN" && detail.role === "USER") && (
                                          <SelectItem key={detail.id} value={detail.id} className={`cursor-pointer capitalize flex gap-x-2 text-sm text-slate-600`}>
                                            {detail.firstName + " " + detail.lastName}
                                          </SelectItem>
                                        )
                                      ))
                                    }
                                    </SelectGroup>

                                    <SelectGroup className="capitalize">
                                      <SelectLabel className={`text-[var(--specialtext)] text-base font-bold`}>Managers</SelectLabel>
                                    {
                                      users.map((detail) => (
                                        (detail.role !== "ADMIN" && detail.role === "MANAGER") && (
                                          <SelectItem key={detail.id} value={detail.id} className={`cursor-pointer capitalize flex gap-x-2 text-sm text-slate-600`}>
                                            {detail.firstName + " " + detail.lastName}
                                          </SelectItem>
                                        )
                                      ))
                                    }
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                <p className="text-sm text-slate-500 w-2/3 text-center">Selected employee will take place of this manager</p>
                              </div>
                            }

                            <AlertDialogFooter
                              className={`flex min-[450px]:flex-row justify-center gap-x-6 *:w-1/3 max-[450px]:*:w-full items-center *:cursor-pointer w-full`}
                            >
                              <AlertDialogCancel className={` cursor-pointer`}>
                                Cancel
                              </AlertDialogCancel>
                              {
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
                              }
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </span>
                    </li>
                  </ul>
                )
            )} */}
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
