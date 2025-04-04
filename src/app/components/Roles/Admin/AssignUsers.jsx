'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { Check, Delete, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";


export default function AssignUsers() {
  const [users, setUsers] = useState([]);
  const [addDetail, setAddDetail] = useState(false);
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
    }
    const toastId = toast.loading(`Assigning user...`)
    try {
      const res = await axios.post("/api/admin/assign-user", {userId, managerId});
      if(res.status === 200){
        toast.success(`User assigned!`, { id: toastId})
        setAddDetail(false)
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
    <div className="flex flex-col justify-center items-center p-5 w-full h-full"> 
      <div className="flex flex-col w-full h-full">
        <Accordion type="single" collapsible className="w-full gap-5 grid grid-cols-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 py-4 *:h-fit items-start *:self-start">
        {
          managersDetail?.map((managers, i) => (
            <AccordionItem value={`item-${i + 1}`} key={managers.id} className={`w-full items-centertext-lg border-2 border-[var(--specialtext)]/50 p-3 rounded-lg`}>
              <AccordionTrigger className={`flex text-start w-full capitalize`}>
                <span><span className="text-[var(--specialtext)] font-semibold">Manager -</span> {managers.firstName + " " + managers.lastName}</span>
              </AccordionTrigger>
              <AccordionContent className={`py-3`}>
                <div className="flex justify-between items-center">
                  <label className="text-base "><span className="text-[var(--specialtext)] font-semibold">Assigned Employees - </span>{managers?.assignedUsers?.length || 0}</label>

                  <Dialog>
                    <DialogTrigger className="flex items-center">
                      <span className="bg-orange-600 hover:bg-orange-700 text-white rounded-full cursor-pointer p-2">
                        <Plus size={18}/>
                      </span>
                    </DialogTrigger>
                    <DialogContent className={`w-1/2 max-lg:w-2/3 max-md:w-full`}>
                      <DialogHeader className={`items-center pb-4`}>
                        <DialogTitle className={`text-[var(--specialtext)]`}>
                        <span className="relative flex items-center">
                          All Employees 
                          <span className="absolute -right-7 top-1/2 -translate-y-1/2 text-orange-600 rounded-full cursor-pointer">
                            <Plus size={19} onClick={() => setAddDetail(true)}/>
                          </span>
                        </span>
                        </DialogTitle>
                        <DialogDescription>Here is the list of users assigned to <span className="capitalize font-semibold">{`${managers?.firstName + " " + managers?.lastName}`}</span></DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-y-5">
                        <div className="flex text-center *:w-1/2 text-[var(--lightText)] font-semibold text-lg">
                          <h1>Name</h1>
                          <h1>Action</h1>
                        </div>
                        <div className="flex flex-col gap-y-4">
                        {
                          addDetail && 
                          <div className="flex text-center *:w-1/2 text-orange-500 font-semibold text-base items-center justify-center">
                            
                              <div className="flex justify-center text-[var(--specialtext)] font-light">
                                <Select
                                  onValueChange={(value) => setValue("userId", value)}
                                >
                                  <SelectTrigger className="cursor-pointer w-2/3 max-sm:w-full py-1 text-center rounded-md border border-orange-700 text-sm text-[var(--withdarkinnertext)] capitalize">
                                    <SelectValue placeholder="Employees" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup className="capitalize">
                                    {
                                      usersDetail.filter(user => !user.managerId).map((user, i) => (
                                        <SelectItem value={user.id} key={i} className={`cursor-pointer`}>
                                          {user.firstName + " " + user.lastName}
                                        </SelectItem>
                                      ))
                                    }
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                            <p className="flex justify-center gap-x-4 *:cursor-pointer">
                              <span onClick={() => addUser(managers.id)}><Check className="p-1 rounded-full bg-green-600 text-white" size={24}/></span>
                              <span onClick={() => setAddDetail(false)}><X className="p-1 rounded-full bg-red-600 text-white" size={24}/></span>
                            </p>
                            
                          </div>
                          }
                            
                            {
                              usersDetail.filter(user => user.managerId === managers.id ).length > 0 ?
                              (usersDetail.filter(user => user.managerId === managers.id).map((user) => (
                                <div key={user.id} className="flex text-center *:w-1/2 text-orange-500 font-semibold text-base justify-center">
                                      <p className="capitalize">{user?.firstName + " " + user?.lastName}</p>
                                      <p className="flex justify-center"><Trash2 onClick={() => removeUser(user.id, managers.id)} size={19} className="text-red-500 cursor-pointer" /></p>
                                </div>
                              ))) : (
                                !addDetail && <div className="flex justify-center text-slate-500">No user assigned!</div>
                              )
                            }
                        </div>
                        
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                </div>
              </AccordionContent>
            </AccordionItem>

          ))
        }
        </Accordion>
      </div>
    </div>
  )
}
