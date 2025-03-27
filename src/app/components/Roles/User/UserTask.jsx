'use client'
import axios from "axios";
import { useEffect, useState } from "react";


export default function UserTask() {
    const [tasks, setTasks] = useState();
    const fetchUserTasks = async () => {
        try {
          const { data } = await axios.get("/api/user/get-tasks");
          console.log(data);
          
          setTasks(data)
        } catch (error) {
          console.error("Error fetching tasks:", error);
        }
      };
      useEffect(() => {
        fetchUserTasks()
      }, []);
  return (
    <div className="flex flex-col p-5 gap-y-10">
      <div className="flex justify-center">
        <h2 className="text-2xl font-semibold text-[var(--lightText)]">
          Your Tasks
        </h2>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-y-7 w-full">
          <ul className="flex w-full font-bold text-lg text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
            <li className="w-1/3">Ttile</li>
            <li className="w-1/3">Description</li>
            <li className="w-1/3">Status</li>
          </ul>
          <div className="flex flex-col gap-y-3 text-sm">
          {tasks?.map((task, i) => (
            <ul className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full" key={task.id}>
              <li className="w-1/3 capitalize">{task.title}</li>
              <li className="w-1/3">{task.description}</li>
              <li className="w-1/3">{task.status}</li>
            </ul>
          ))}
          </div>
          
        </div>
      </div>
    </div>
  )
}
