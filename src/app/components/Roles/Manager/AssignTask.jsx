"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

export default function CreateTask() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { register, handleSubmit, watch, reset } = useForm();

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
    try {
      const { data } = await axios.get("/api/manager/get-tasks");
      setTasks(data);
      console.log(data);
      
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch tasks");
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
      <div className="flex ">

        <div className="flex flex-col gap-y-10 w-1/4 h-full justify-center">
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
                className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--background)] px-1 transition-all duration-200 ${
                  watch("title") && `-translate-x-2 scale-90 -translate-y-8.5`
                }`}
              >
                Title
              </label>
            </div>
            <div className="relative flex flex-col w-full">
              <textarea
                id="description"
                className="border w-full px-5 py-2.5 rounded-lg peer text-[var(--withdarkinnertext)]"
                {...register("description")}
                spellCheck="false"
                required
              />
              <label
                htmlFor="description"
                className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-11 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--background)] px-1 transition-all duration-200 ${
                  watch("description") && `-translate-x-2 scale-90 -translate-y-11`
                }`}
              >
                Description
              </label>
            </div>
            <select
              className="border rounded-full py-3 px-3 w-full mb-2 outline-none"
              {...register("userId")} // ✅ Corrected key to "userId"
              required
            >
              <option value="">Select User</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1 bg-[var(--dark-btn)] text-white rounded-full w-1/2 cursor-pointer"
            >
              Create Task
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-y-10 w-3/4 h-full overflow-scroll">
          <div className="flex justify-center">
            <h2 className="text-2xl font-semibold text-[var(--lightText)]">
              Assigned Tasks
            </h2>
          </div>

          <div className="flex flex-col gap-y-7 w-full px-5 overflow-hidden">
            <ul className="flex w-full font-bold text-md text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
              <li className="w-1/4">Title</li>
              <li className="w-1/4">Description</li>
              <li className="w-1/4">Assigned To</li>
              <li className="w-1/4">Status</li>
            </ul>
            <div className="flex flex-col gap-y-3 text-sm overflow-y-auto">
              {tasks.map((task) => (
                <ul
                  className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full"
                  key={task.id}
                >
                  <li className="w-1/4 capitalize">{task.title}</li>
                  <li className="w-1/4">{task.description}</li>
                  <li className="w-1/4 capitalize">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </li>
                  <li className="w-1/4">{task.status}</li>
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
