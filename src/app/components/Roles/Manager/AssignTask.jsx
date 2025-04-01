"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReportedTask from "./ReportedTask";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import StatusMessage from "./StatusMessage";

export default function CreateTask() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [checkTask, setCheckTask] = useState(null);
  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      feedBack: "",
  }});

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/manager/get-users");
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users");
    }
  };

  const fetchTasks = async () => {
    const toastId = toast.loading(`Fetching tasks...`)
    try {
      const { data } = await axios.get("/api/manager/get-tasks");
      if(data){
        setTasks(data);
        toast.success(`Fetched Successfully!`, {id: toastId})
      }else{
        toast.error(`Couldn't fetch the data`, {id: toastId})
      }
      
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch tasks", {id: toastId});
    }
  };

  const createTask = async (data) => {
    try {
      await axios.post("/api/manager/create-task", data);
      toast.success("Task created successfully");
      fetchTasks();
      reset(); // ✅ Reset form fields after submission
    } catch (error) {
      toast.error(error.response?.data?.error || "Error creating task");
    }
  };

  return (
    <div className="flex flex-col p-5 gap-y-10 h-full overflow-hidden">
      <div className="flex justify-center">

        {!checkTask ? 
         <>
          <div className="flex flex-col gap-y-10 w-1/2 h-full justify-center">
            <div className="flex justify-center">
              <h2 className="text-2xl font-semibold text-[var(--lightText)]">
                Assign Tasks
              </h2>
            </div>
            <form onSubmit={handleSubmit(createTask)} className="flex flex-col gap-y-5 items-center">
              <div className="flex flex-col relative w-full">
                <input
                  type="text"
                  id="title"
                  className="w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                  {...register("title")}
                />
                <label
                  htmlFor="title"
                  className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                    watch("title") && `-translate-x-2 scale-90 -translate-y-8.5`
                  }`}
                >
                  Title
                </label>
              </div>
              <div className="relative flex flex-col w-full">
                <textarea
                  id="description"
                  className="border w-full px-5 py-2.5 rounded-lg peer text-[var(--withdarkinnertext)] resize-none outline-none"
                  {...register("description")}
                  spellCheck="false"
                  rows={5}
                  required
                />
                <label
                  htmlFor="description"
                  className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-20.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                    watch("description") && `-translate-x-2 scale-90 -translate-y-20.5`
                  }`}
                >
                  Description
                </label>
              </div>
              <Select onValueChange={(value) => setValue("userId", value)} defaultValue="">
                <SelectTrigger className="w-full rounded-full py-6 px-4 text-md text-[var(--withdarkinnertext)]">
                  <SelectValue placeholder="Select an employee"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="flex w-full justify-center gap-x-5">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="px-3 py-1 bg-white text-[var(--dark-btn)] border border-current rounded-full w-1/3 cursor-pointer"
                    >
                      Show assigned task
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3/4 gap-y-7">
                    <DialogHeader className={`items-center`}>
                      <DialogTitle className={`text-[var(--specialtext)]`}>Assigned Tasks</DialogTitle>
                      <DialogDescription>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-y-7 w-full px-5 overflow-hidden cursor-default">
                      <ul className="flex w-full font-bold text-md text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full *:px-1">
                        <li className="w-1/5">Title</li>
                        <li className="w-1/5">Description</li>
                        <li className="w-1/5">Assigned To</li>
                        <li className="w-1/5">Status</li>
                        <li className="w-1/5">Report</li>
                      </ul>
                      <div className="flex flex-col gap-y-3 text-sm overflow-y-auto">
                        {tasks.length > 0 ? tasks.map((task) => (
                          <ul
                            className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full *:px-1"
                            key={task.id}
                          >
                            <li className="w-1/5 capitalize">{task.title}</li>
                            <li className="w-1/5">{task.description}</li>
                            <li className="w-1/5 capitalize">
                              {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </li>
                            <li className={`w-1/5 ${task.status === 'Completed' ? `text-green-600` : task.status === 'Pending' ? `text-yellow-600` : task.status === 'Delayed' ? `text-orange-600` : `text-red-600`}`}>{task.status}</li>
                            {task.reportMessage && <li className={`w-1/5 cursor-pointer underline text-yellow-600`}><span onClick={() => setCheckTask(task)}>Reported</span></li>}
                            {/* {
                              (!task.reportMessage && (task.status === 'Delayed' || task.status === 'Closed')) ? 
                              <li className={`${task.status === 'Delayed' ? `text-orange-600` : `text-red-600`} w-1/5 flex justify-center`}>{task.status}</li>
                              :
                              <li className={`w-1/5 flex justify-center`}>
                                <Select
                                  defaultValue="--"
                                  onValueChange={(value) => {
                                  if (value !== "--") {
                                    changeStatus(task.id, value);
                                  }
                                }}
                                >
                                  <SelectTrigger className={`text-md capitalize border-none text-center justify-center w-1/2 ${watch('status') === 'Closed' ? ` text-red-600` : `text-orange-600`}`}>
                                    <SelectValue placeholder="--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup className="capitalize *:cursor-pointer">
                                      <SelectItem value="--">
                                        --
                                      </SelectItem>
                                      <SelectItem value="Delayed">
                                        delayed
                                      </SelectItem>
                                      <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </li>
                            } */}
                            {
                              !task.reportMessage &&
                              <li className={`w-1/5 flex justify-center inert`}>
                                <StatusMessage task={task} fetchTasks={fetchTasks}/>
                              </li>
                            }
                          </ul>
                        )) : 
                          <div className="flex justify-center text-slate-500">
                            No tasks assigned!
                          </div>}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[var(--dark-btn)] text-white rounded-full w-1/3 cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
         </>
         :
         <ReportedTask checkTask={checkTask} setCheckTask={setCheckTask} fetchTasks={fetchTasks}/>
        }
      </div>
    </div>
  );
}
