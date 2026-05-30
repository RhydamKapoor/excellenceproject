"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, UserRound, AlertTriangle } from "lucide-react";
import ReportedTask from "./ReportedTask";
import StatusMessage from "./StatusMessage";

const STATUS_STYLES = {
  Completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Delayed: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  Closed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium capitalize leading-none ${
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export default function CreateTask() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [checkTask, setCheckTask] = useState(null);
  const [reassignTaskId, setReassignTaskId] = useState(null);
  const [reassignUserId, setReassignUserId] = useState("");

  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: { userId: "" },
  });

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
      setTasks(data ?? []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch tasks");
    }
  };

  const createTask = async (data) => {
    const toastId = toast.loading("Creating task...");
    try {
      await axios.post("/api/manager/create-task", data);
      toast.success("Task created successfully", { id: toastId });
      fetchTasks();
      reset({ userId: "" });
    } catch (error) {
      toast.error(error.response?.data?.error || "Error creating task", { id: toastId });
    }
  };

  const reassignTask = async () => {
    if (!reassignUserId) {
      toast.error("Please select an employee");
      return;
    }
    const toastId = toast.loading("Reassigning task...");
    try {
      const res = await axios.post("/api/manager/reassign-task", {
        taskId: reassignTaskId,
        newUser: reassignUserId,
      });
      if (res.status === 200) {
        toast.success("Task reassigned successfully", { id: toastId });
        setReassignTaskId(null);
        setReassignUserId("");
        fetchTasks();
      } else {
        toast.error("Error reassigning task", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error reassigning task", {
        id: toastId,
      });
    }
  };

  const visibleTasks = tasks.filter(
    (task) => !(task?.assignedUsers?.id === "" && task?.status === "Completed")
  );

  if (checkTask) {
    return (
      <ReportedTask
        checkTask={checkTask}
        setCheckTask={setCheckTask}
        fetchTasks={fetchTasks}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Assign tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create tasks for your team and track their progress.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create task form */}
        <div className="card-surface lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">Create new task</h2>
                <p className="text-xs text-muted-foreground">Assign work to a team member</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(createTask)} className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="input-field-compact"
                placeholder="e.g. Q1 report review"
                {...register("title", { required: true })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="description"
                className="input-field min-h-[100px] resize-none py-2.5 text-sm"
                placeholder="Describe the task requirements..."
                {...register("description", { required: true })}
                spellCheck="false"
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Assign to</label>
              <Select
                value={watch("userId")}
                onValueChange={(value) => setValue("userId", value)}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border border-input bg-background px-4 text-sm shadow-none">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectGroup>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="mt-1 h-10 w-full rounded-xl font-semibold">
              Create task
            </Button>
          </form>
        </div>

        {/* Task list */}
        <div className="card-surface flex max-h-[620px] w-full min-w-0 flex-col overflow-hidden lg:col-span-3">
          <div className="shrink-0 border-b border-border px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">Assigned tasks</h2>
                <p className="text-xs text-muted-foreground">
                  {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""} active
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto">
            {visibleTasks.length > 0 ? (
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Title</th>
                    <th className="px-5 py-2.5 font-semibold">Description</th>
                    <th className="px-5 py-2.5 font-semibold">Assignee</th>
                    <th className="px-5 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="max-w-[160px] px-5 py-3.5 align-middle">
                        <span className="block truncate font-medium capitalize text-foreground">
                          {task.title}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-5 py-3.5 align-middle">
                        <span className="line-clamp-2 text-muted-foreground">
                          {task.description}
                        </span>
                      </td>
                      <td className="max-w-[160px] px-5 py-3.5 align-middle">
                        {task?.assignedUsers?.id ? (
                          <span className="inline-flex max-w-full items-center gap-1.5 capitalize">
                            <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {task.assignedUsers.firstName} {task.assignedUsers.lastName}
                            </span>
                          </span>
                        ) : task.status !== "Completed" ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() => {
                              setReassignTaskId(task.id);
                              setReassignUserId("");
                            }}
                          >
                            Assign employee
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <StatusBadge status={task.status} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center align-middle">
                        <div className="flex items-center justify-center">
                          {task.reportMessage ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 rounded-lg border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                              onClick={() => setCheckTask(task)}
                            >
                              <AlertTriangle className="size-3.5" />
                              Reported
                            </Button>
                          ) : (
                            <StatusMessage task={task} fetchTasks={fetchTasks} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <ClipboardList className="size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                <p className="text-xs text-muted-foreground">
                  Create a task using the form to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reassign dialog */}
      <Dialog
        open={!!reassignTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setReassignTaskId(null);
            setReassignUserId("");
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign task</DialogTitle>
            <DialogDescription>
              Select a team member to assign this task to.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <Select value={reassignUserId} onValueChange={setReassignUserId}>
              <SelectTrigger className="h-10 w-full rounded-lg border border-input bg-background px-4 text-sm shadow-none">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectGroup>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              type="button"
              className="h-10 w-full rounded-xl font-semibold"
              onClick={reassignTask}
            >
              Confirm reassignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
