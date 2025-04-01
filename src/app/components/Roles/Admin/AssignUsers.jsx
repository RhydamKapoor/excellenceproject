'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


export default function AssignUsers() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const toastId = toast.loading(`Fetching...`);
    try {
      const { data } = await axios.get("/api/admin/get-users");
      toast.success(`Employees fetched!`, { id: toastId });
      console.log(data);
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users", {
        id: toastId,
      });
    }
  }
  const managersDetail = users.filter((user) => user.role === "MANAGER");
  const usersDetail = users.filter((user) => user.role === "USER");

  useEffect(() => {
    fetchUsers()
  }, []);
  return (
    <div className="flex flex-col justify-center items-center p-5 w-full h-full"> 
      <div className="flex flex-col w-full h-full">
        <Accordion type="single" collapsible className="w-full gap-5 grid grid-cols-2 py-4 *:h-fit items-start *:self-start">
        {
          managersDetail?.map((managers, i) => (
            <AccordionItem value={`item-${i + 1}`} key={managers.id} className={`w-full items-centertext-lg border-2 border-[var(--specialtext)]/50 p-3 rounded-lg`}>
              <AccordionTrigger className={`flex text-start w-full capitalize`}>
                <span><span className="text-[var(--specialtext)] font-semibold">Manager -</span> {managers.firstName + " " + managers.lastName}</span>
              </AccordionTrigger>
              <AccordionContent className={`py-3`}>
                <div className="flex justify-between items-center">
                  <label className="text-base "><span className="text-[var(--specialtext)] font-semibold">Users - </span>10</label>
                  <Dialog>
                    <DialogTrigger>
                      <span className="bg-orange-700 text-white p-2 px-4 rounded-full text-sm cursor-pointer">Review the list</span>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader className={`items-center`}>
                        <DialogTitle className={`text-[var(--specialtext)]`}>All Users</DialogTitle>
                        <DialogDescription>Here is the list of users assigned to <span className="capitalize font-semibold">{`${managers?.firstName + " " + managers?.lastName}`}</span></DialogDescription>
                      </DialogHeader>
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
