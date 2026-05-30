"use client";

import axios from "axios";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

const statusConfig = {
  Pending: { icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  Completed: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  Delayed: { icon: AlertCircle, className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  Closed: { icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

export default function UserTask() {
  const [tasks, setTasks] = useState([]);
  const [taskDetail, setTaskDetail] = useState(null);
  const { register, handleSubmit } = useForm();

  const fetchUserTasks = async () => {
    try {
      const { data } = await axios.get("/api/user/get-tasks");
      setTasks(data);
    } catch {
      /* silent refresh */
    }
  };

  const SubmitTask = async (data) => {
    const toastId = toast.loading("Submitting...");
    if (taskDetail.status === "Pending" || taskDetail.status === "Delayed") {
      try {
        const res = await axios.post("/api/user/submit-task", { ...data, id: taskDetail.id });
        if (res.status === 200) {
          toast.success("Task submitted", { id: toastId });
          setTaskDetail(null);
          fetchUserTasks();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error", { id: toastId });
      }
    } else if (taskDetail.status === "Completed") {
      toast.success("Task already completed", { id: toastId });
    } else {
      toast.error("Task is closed", { id: toastId });
    }
  };

  useEffect(() => {
    fetchUserTasks();
    const interval = setInterval(fetchUserTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  if (taskDetail?.id) {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setTaskDetail(null)}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to tasks
        </button>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface p-6">
            <h2 className="page-header mb-6 text-xl">Submit report</h2>
            <form onSubmit={handleSubmit(SubmitTask)} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input className="input-field mt-1 capitalize" value={taskDetail.title} readOnly />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="input-field mt-1 min-h-[140px] resize-none"
                  rows={5}
                  {...register("message")}
                />
              </div>
              <Button type="submit" className="rounded-2xl">
                {taskDetail.status === "Completed" ? "Completed" : taskDetail.status === "Closed" ? "Closed" : "Submit report"}
              </Button>
            </form>
          </div>

          <div className="card-surface p-6">
            <h2 className="page-header mb-6 text-xl">Feedback</h2>
            {taskDetail.feedBack ? (
              <textarea
                className="input-field min-h-[200px] resize-none"
                value={taskDetail.feedBack}
                readOnly
              />
            ) : (
              <p className="rounded-2xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                No feedback yet from your manager.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Your tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Click a status to view details and submit reports.</p>
      </div>

      {tasks?.length > 0 ? (
        <div className="card-surface overflow-hidden">
          <div className="hidden border-b border-border bg-muted/30 px-6 py-4 md:grid md:grid-cols-3 md:gap-4">
            <span className="text-sm font-semibold text-muted-foreground">Title</span>
            <span className="text-sm font-semibold text-muted-foreground">Description</span>
            <span className="text-sm font-semibold text-muted-foreground">Status</span>
          </div>
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const cfg = statusConfig[task.status] || statusConfig.Pending;
              const Icon = cfg.icon;
              return (
                <div
                  key={task.id}
                  className="grid gap-3 px-4 py-4 transition-colors duration-200 hover:bg-muted/30 md:grid-cols-3 md:items-center md:gap-4 md:px-6"
                >
                  <p className="font-medium capitalize text-foreground">{task.title}</p>
                  <p className="text-sm text-muted-foreground md:truncate">{task.description}</p>
                  <button
                    type="button"
                    onClick={() => setTaskDetail(task)}
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform duration-200 hover:scale-105 ${cfg.className}`}
                  >
                    <Icon className="size-3.5" />
                    {task.status}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card-surface flex flex-col items-center justify-center p-12 text-center">
          <Clock className="mb-4 size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No tasks assigned yet.</p>
        </div>
      )}
    </div>
  );
}
