'use client'
import { NumberTicker } from "@/components/magicui/number-ticker";
import axios from "axios";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DashboardComp() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [adminDetail, setAdminDetail] = useState([]);

  
  
  const userTaskFetch = async () => {
    const toastId = toast.loading(`Fetching tasks...`)
    try {
      const { data } = await axios.get("/api/user/get-tasks");
      console.log(data);
      
      toast.success(`Have a great day!`, {id: toastId})
      setTasks(data);
    } catch (error) {
        toast.error(error.response?.data?.error || "Failed to fetch tasks", {id: toastId});
      console.error("Error fetching tasks:", error);
    }
  };
  
  const assignedTaskFetch = async () => {
    const toastId = toast.loading(`Fetching tasks...`)
    try {
      const { data } = await axios.get("/api/manager/get-tasks");
      if(data){
        setTasks(data);
        toast.success(`Have a great day!`, {id: toastId})
      }else{
        toast.error(`Couldn't fetch the data`, {id: toastId})
      }
      
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch tasks", {id: toastId});
    }
  };

  const totalUsers = async() => {
    const toastId = toast.loading(`Fetching users...`)
    try {
      const { data } = await axios.get("/api/admin/get-users");
      console.log(data);

      toast.success(`Welcome, Admin!`, {id: toastId})
      setAdminDetail(data);
      console.log(data);
      
    } catch (error) {
        toast.error(error.response?.data?.error || "Failed to fetch users", {id: toastId});
      console.error("Error fetching users:", error);
    }
  }
  useEffect(() => {
    if(session?.user?.role === 'USER'){
        userTaskFetch();
        console.log(`Hey`);
        
    }else if(session?.user?.role === 'MANAGER'){
        assignedTaskFetch();
    }else{
      totalUsers();
    }
  }, [session]);

  const completedCount = tasks.filter(task => task.status === "Completed").length;
  const pendingCount = tasks.filter(task => task.status === "Pending").length;
  const delayedCount = tasks.filter(task => task.status === "Delayed").length;
  const closedCount = tasks.filter(task => task.status === "Closed").length;

  const countUsers = adminDetail.filter(detail => detail.role === "USER").length;
  const countManagers = adminDetail.filter(detail => detail.role === "MANAGER").length;
  return (
    <div className="flex w-full p-5 h-full">
        <div className="flex w-1/3 h-full relative justify-center">
            <Image src={`dashboard.svg`} fill sizes="100px" alt="Dashbaord" priority/>
        </div>
        <div className="flex w-2/3 flex-col h-full justify-between items-center sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold capitalize">Welcome, <span className="text-[var(--specialtext)]">{session?.user?.firstName} {session?.user?.lastName}</span> </h1>
                <p>{session?.user?.role === "USER" ? `Have a look at your task for today` : (session?.user?.role === "ADMIN" ? `Wanna change the roles?` : `Assign any task to your users`)}</p>
            </div>

            <div className="flex flex-col w-1/2 items-center">
                <h1 className="text-lg text-slate-800 font-bold">{session?.user?.role === 'USER' ? `Your Tasks` : session?.user?.role === 'MANAGER' ? `Total Assigned Task` : `Your Users`}</h1>
                <div className="flex flex-col items-center">
                    <h3><NumberTicker value={tasks.length || adminDetail.length - 1}  className="text-5xl py-3 text-[var(--specialtext)]"/></h3>
                </div>
                <div className={`flex flex-col gap-y-3 uppercase w-3/4 font-[family-name:var(--font-roboto)] font-semibold border rounded-xl shadow-xl p-8`}>
                {
                  session?.user?.role === "ADMIN" ? (
                    <div className="flex flex-col gap-y-3 w-full">
                      <div className="flex w-full *:w-1/2 capitalize">
                        <div className="flex flex-col items-center">
                          <label className="text-sm text-slate-800">Total Users</label>
                          <h3><NumberTicker value={countUsers}  className="text-3xl py-3 text-[var(--specialtext)]"/></h3>
                        </div>
                        <div className="flex flex-col items-center">
                          <label className="text-sm text-slate-800">Total Managers</label>
                          <h3><NumberTicker value={countManagers}  className="text-3xl py-3 text-[var(--specialtext)]"/></h3>
                        </div>
                      </div>
                    </div>
                  ) :
                  <div className="flex flex-col gap-y-3 w-full">
                    <div className="flex justify-between *:text-green-600">
                        <label>Completed</label>
                        <NumberTicker value={completedCount}/>
                    </div>
                    <div className="flex justify-between *:text-yellow-600">
                        <label>Pending</label>
                        <NumberTicker value={pendingCount}/>
                    </div>
                    <div className="flex justify-between *:text-orange-600">
                        <label>Delayed</label>
                        <NumberTicker value={delayedCount}/>
                    </div>
                    <div className="flex justify-between *:text-red-700">
                        <label>closed</label>
                        <NumberTicker value={closedCount}/>
                    </div>
                  </div>
                }
                  
                </div>
            </div>
        </div>
    </div>
  )
}
