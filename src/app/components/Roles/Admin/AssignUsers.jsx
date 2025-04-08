'use client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { Check, Grip, GripHorizontal, GripVertical, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";


export default function AssignUsers() {
  const [users, setUsers] = useState([]);
  const [addDetail, setAddDetail] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const {register, handleSubmit, setValue, watch} = useForm()

  const fetchUsers = async () => {
    const toastId = toast.loading(`Fetching...`);
    try {
      const { data } = await axios.get("/api/admin/get-users");
      toast.success(`Employees fetched!`, { id: toastId });
      // console.log(data);
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users", {
        id: toastId,
      });
    }
  }
  const managersDetail = users?.filter((user) => user.role === "MANAGER");
  const usersDetail = users?.filter((user) => user.role === "USER");

  const addUser = async(managerId) => {
    const userId = watch("userId");
    if(!userId){
      toast(`Please select any user!`, {
        icon: "⚠️"
      })
      return;
    }
    const toastId = toast.loading(`Assigning user...`)
    try {
      const res = await axios.post("/api/admin/assign-user", {userId, managerId});
      if(res.status === 200){
        
        toast.success(`User assigned!`, { id: toastId})
        setAddDetail(false)
        fetchUsers();
        setValue("userId", "")
      }else{
        toast.error("Failed to assign user", {
        id: toastId,
      });
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message, {id: toastId})
    }
    
  }

  const removeUser = async(userId, managerId) => {
    const toastId = toast.loading(`Removing user...`)
    try {
      const res = await axios.post("/api/admin/remove-user", {userId, managerId});
      if(res.status === 200){
        toast.success(`User removed!`, { id: toastId})
        fetchUsers();
      }else{
        toast.error("Failed to assign user", {
        id: toastId,
      });
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message, {id: toastId})
    }
  }

  useEffect(() => {
    fetchUsers()
  }, []);

  return (
    <div className="flex flex-col p-5 gap-y-10 w-full">
      <div className="flex flex-col overflow-x-auto w-full">
        <div className="flex flex-col gap-y-7 w-full min-w-[580px]">
          <ul className="flex w-full font-bold text-lg text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
            <li className="w-1/3">Manager</li>
            <li className="w-1/3">Assigned Users</li>
            <li className="w-1/3">Action</li>
          </ul>
          <div className="flex flex-col gap-y-3 text-sm">
            {managersDetail?.map((manager) => (
              <ul key={manager.id} className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full">
                <li className="w-1/3 capitalize">
                  {manager.firstName} {manager.lastName}
                </li>
                <li className="w-1/3">
                  {usersDetail.filter(user => user.managerId === manager.id).length || 0}
                </li>
                <li className="w-1/3 flex justify-center">
                  <Dialog>
                    <DialogTrigger className="p-1 bg-[var(--dark-btn)] rounded-full text-white cursor-pointer flex w-1/3 max-lg:w-2/3 max-md:w-full items-center justify-center gap-x-1">
                      <Grip size={18} strokeWidth={1.5}/>
                      Manage users
                    </DialogTrigger>
                    <DialogContent className="w-2/3 max-lg:w-2/3 max-md:w-full flex max-lg:flex-col *:w-1/2 max-lg:*:w-full h-2/5 max-lg:h-[90vh] overflow-y-auto">
                      <div className=" lg:sticky max-lg:relative top-0 flex flex-col gap-y-6 border-r-2 max-lg:border-r-0 border-[var(--specialtext)] max-lg:py-7">
                        
                        <DialogHeader className="items-center pb-4">
                          <DialogTitle className="text-[var(--specialtext)] text-lg">
                            <span className="relative flex items-center text-3xl">
                              Assign
                            </span>
                          </DialogTitle>
                          <DialogDescription>
                            Select the employees you want to assign
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex flex-col gap-y-5">
                          <div className="flex flex-col gap-y-4 items-center">
                              <div className="flex flex-col gap-y-5 text-center w-full *:w-1/2 text-orange-500 font-semibold text-base items-center justify-center">
                                <div className="flex justify-center text-[var(--specialtext)] font-light">
                                  <Select
                                    onValueChange={(value) => setValue("userId", value)}
                                  >
                                    <SelectTrigger className="cursor-pointer w-full max-sm:w-full py-1 text-center rounded-md border border-slate-500 text-base text-[var(--withdarkinnertext)] capitalize">
                                      <SelectValue placeholder="Employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup className="capitalize">
                                      {
                                        usersDetail.filter(user => !user.managerId).map((user, i) => (
                                          <SelectItem value={user.id} key={i} className="cursor-pointer">
                                            {user.firstName + " " + user.lastName}
                                          </SelectItem>
                                        ))
                                      }
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <p className="flex justify-center gap-x-2 *:cursor-pointer w-full *:w-1/2">
                                  <span onClick={() => addUser(manager.id)} className="flex justify-center bg-green-400/40 text-green-600 rounded-full py-1"><Check className="p-1 rounded-full" size={26}/></span>
                                </p>
                              </div>
                            
                          </div>
                        </div>
                      </div>
                      <div className=" flex flex-col gap-y-2 h-full overflow-y-auto">
                        <DialogHeader className="items-center pb-4">
                          <DialogTitle className="text-[var(--specialtext)] text-lg">
                            <span className="relative flex items-center text-xl">
                              All assigned employees 
                            </span>
                          </DialogTitle>
                          <DialogDescription>
                            Here is the list of users assigned to <span className="capitalize font-semibold">{`${manager?.firstName} ${manager?.lastName}`}</span>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-y-5 overflow-y-auto h-full pb-2">
                          
                        {usersDetail.filter(user => user.managerId === manager.id).length > 0 ?
                              (usersDetail.filter(user => user.managerId === manager.id).map((user) => (
                                <div key={user.id} className="flex w-full *:w-1/2 text-gray-600 font-semibold text-base items-center">
                                  <p className="capitalize text-start pl-16">{user?.firstName + " " + user?.lastName}</p>
                                  <span className="flex items-center justify-center">
                                    <button onClick={() => removeUser(user.id, manager.id)} className="bg-[var(--dark-btn)] text-slate-100 rounded-full cursor-pointer text-xs py-1 px-4" >Remove</button>
                                  </span>
                                </div>
                              ))) : (
                                !addDetail && <div className="flex justify-center items-center text-red-700 font-semibold h-2/3">No user assigned!</div>
                              )
                            }
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </li>
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
