"use client";
import axios from "axios";
import { CircleArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function UserTask() {
  const [tasks, setTasks] = useState();
  const [taskDetail, setTaskDetail] = useState(null);
  const { register, handleSubmit, watch } = useForm();

  
  const fetchUserTasks = async () => {
    try {
      const { data } = await axios.get("/api/user/get-tasks");

      setTasks(data);
    } catch (error) {
      // console.error("Error fetching tasks:", error);
    }
  };

  const SubmitTask = async (data) => {
    const toastId = toast.loading("Processing...");
    if(taskDetail.status === 'Pending' || taskDetail.status === 'Delayed'){
      try {
        const res = await axios.post("/api/user/submit-task", {
          ...data,
          id: taskDetail.id,
        });
        if (res.status === 200) {
          toast.success(`Task submitted`, { id: toastId });
          setTaskDetail({ id: "", title: "" });
        } else {
          toast.error("Something went wrong!", { id: toastId });
        }
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message, { id: toastId });
      }
    }
    else if(taskDetail.status === 'Completed'){
      toast.success(`The task already completed!`, {id: toastId})
    }
    else if(taskDetail.status === 'Closed'){
      toast.error(`The task has been closed!`, {id: toastId})
    }
  };

  useEffect(() => {
    fetchUserTasks();
  
    const interval = setInterval(() => {
      
      fetchUserTasks();
    }, 10000);
  
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col p-5 gap-y-10">
      {!taskDetail?.id ? (
        <>
          <div className="flex justify-center relative">
            <div className="relative flex items-center">
              <h2 className="text-2xl font-semibold text-[var(--lightText)]">
                Your Tasks
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center">
            {tasks?.length > 0 ? (
              <div className="flex flex-col gap-y-7 w-full">
                <ul className="flex w-full font-bold text-lg text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
                  <li className="w-1/3">Ttile</li>
                  <li className="w-1/3">Description</li>
                  <li className="w-1/3">Status</li>
                </ul>
                <div className="flex flex-col gap-y-3 text-sm">
                  {tasks?.map((task, i) => (
                    <ul
                      className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full"
                      key={task.id}
                    >
                      <li className="w-1/3 capitalize">{task.title}</li>
                      <li className="w-1/3">{task.description}</li>
                      <li className="w-1/3">
                        <span
                          className={`underline cursor-pointer ${
                            task.status === "Pending"
                              ? " text-yellow-700"
                              : task.status === "Completed" ? `text-green-600` : task.status === "Delayed" ? `text-orange-600` : `text-red-600`
                          }`}
                          onClick={() =>
                            setTaskDetail(task)
                          }
                        >
                          {task.status}
                        </span>
                      </li>
                    </ul>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500">
                You have no tasks at the moment.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex relative *:w-1/2 max-md:*:w-full max-md:flex-col *:gap-y-4 gap-y-9">
          <span
            className="absolute left-0 cursor-pointer"
            onClick={() => setTaskDetail({ id: "", title: "" })}
          >
            <CircleArrowLeft color="#92613a" strokeWidth={1.5} size={28} />
          </span>

          {/* Submit Report Form */}
          <div className="flex flex-col items-center">
            <div className="flex">
              <h2 className="text-2xl font-semibold text-[var(--lightText)]">
                Submit your report
              </h2>
            </div>
            <div className=" rounded-xl flex flex-col p-7 w-full">
              <form
                onSubmit={handleSubmit(SubmitTask)}
                className="flex flex-col gap-y-5 items-center"
              >
                <div className="flex flex-col relative w-full">
                  <input
                    type="text"
                    id="title"
                    className={`w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]`}
                    value={taskDetail.title}
                    readOnly
                  />
                  <label
                    htmlFor="title"
                    className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                      taskDetail.title &&
                      `-translate-x-2 scale-90 -translate-y-8.5`
                    }`}
                  >
                    title
                  </label>
                </div>
                {/* <Textarea name={`message`} register={register} watch={watch} labelHeight={70}/> */}

                <div className="relative flex flex-col w-full">
                  <textarea
                    id="message"
                    className="border w-full px-5 py-2.5 rounded-lg peer text-[var(--withdarkinnertext)] resize-none outline-none"
                    {...register("message")}
                    spellCheck="false"
                    rows={6.5}
                    // required
                  />
                  <label
                    htmlFor="message"
                    className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-[94px] peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200${
                      watch("message") &&
                      `-translate-x-2 scale-90 -translate-y-[94px]`
                    }`}
                  >
                    message
                  </label>
                </div>
                <div className="flex w-full justify-center text-white">
                  <button
                    className={`bg-[var(--dark-btn)] w-1/2 py-1 rounded-full cursor-pointer`}
                  >
                    {taskDetail.status === "Completed" ? `You have completed the task` : taskDetail.status === "Closed" ? `Task is closed` : `Submit`}
                  </button>
                </div>
              </form>
            </div>
          </div>


          {/* Feedback */}
          <div className="flex flex-col items-center">
            <div className="flex">
              <h2 className="text-2xl font-semibold text-[var(--lightText)]">
                Feedback
              </h2>
            </div>
              {
                taskDetail.feedBack ? (
                  
                <div className=" rounded-xl flex flex-col p-7 w-full">
                    <div className="flex flex-col relative w-full">
                      <textarea
                        id="feedback"
                        className="border w-full px-5 py-5 rounded-lg peer text-[var(--withdarkinnertext)] resize-none outline-none"
                        spellCheck="false"
                        value={taskDetail.feedBack}
                        rows={8}
                        readOnly
                      />
                      <label
                        htmlFor="message"
                        className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-[127px] peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                          taskDetail.feedBack &&
                          `-translate-x-2 scale-90 -translate-y-[127px]`
                        }`}
                      >
                        Feedback
                      </label>
                    </div>
                </div>
                ) : (
                  <div className="flex text-slate-500">
                    No feedback received!
                  </div>
                )
              }
          </div>
        </div>
      )}
    </div>
  );
}
