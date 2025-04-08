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
      toast.error(error.response?.data?.message || "Failed to fetch tasks", {id: toastId});
      console.log(error);
    }
  };

  const totalUsers = async() => {
    const toastId = toast.loading(`Fetching users...`)
    try {
      const { data } = await axios.get("/api/admin/get-users");
      // console.log(data);

      toast.success(`Welcome, Admin!`, {id: toastId})
      setAdminDetail(data);
      
    } catch (error) {
        toast.error(error.response?.data?.error || "Failed to fetch users", {id: toastId});
      console.error("Error fetching users:", error);
    }
  }
  useEffect(() => {
    if(session){
      console.log(session);
      
    }
    if(session?.user?.role === 'USER'){
        userTaskFetch();
        
    }else if(session?.user?.role === 'MANAGER'){
        assignedTaskFetch();
    }else if(session?.user?.role === 'ADMIN'){
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
    <div className="flex w-full p-5 h-full max-[1200px]:justify-center">
        <div className="flex w-1/3 max-[1200px]:hidden h-full relative justify-center">
            <Image src={`dashboard.svg`} fill sizes="100px" alt="Dashbaord" priority className="max-[1200px]:hidden"/>
        </div>
        <div className="flex w-2/3 max-[1200px]:w-3/4 flex-col h-full max-md:justify-center max-md:gap-y-20 justify-between items-center sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold capitalize text-center flex gap-x-2 max-[460px]:flex-col">Welcome, <span className="text-[var(--specialtext)] ">{session?.user?.name}</span> </h1>
                <p>{session?.user?.role === "USER" ? `Have a look at your task for today` : (session?.user?.role === "ADMIN" ? `Wanna change the roles?` : `Assign any task to your users`)}</p>
            </div>

            <div className="flex flex-col w-1/2 max-[1200px]:w-2/3 items-center">
                <h1 className="text-lg text-center text-slate-800 font-bold">{session?.user?.role === 'USER' ? `Your Tasks` : session?.user?.role === 'MANAGER' ? `Total Assigned Task` : `Your employees`}</h1>
                <div className="flex flex-col items-center">
                    {session?.user?.role === "ADMIN" ? 
                      <h3><NumberTicker value={adminDetail.length - 1}  className="text-5xl py-3 text-[var(--specialtext)]"/></h3>
                      : <h3><NumberTicker value={tasks.length}  className="text-5xl py-3 text-[var(--specialtext)]"/></h3>
                    }
                </div>
                <div className={`flex flex-col gap-y-3 uppercase w-3/4 min-w-[280px] font-[family-name:var(--font-roboto)] font-semibold border rounded-xl shadow-xl p-8`}>
                {
                  session?.user?.role === "ADMIN" ? (
                    <div className="flex flex-col gap-y-3 w-full">
                      <div className="flex w-full *:w-1/2 capitalize">
                        <div className="flex flex-col items-center">
                          <label className="text-sm text-slate-800">Total Users</label>
                          <h3><NumberTicker value={countUsers || 0}  className="text-3xl py-3 text-[var(--specialtext)]"/></h3>
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
