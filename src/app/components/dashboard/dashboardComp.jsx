'use client'

import { NumberTicker } from "@/components/magicui/number-ticker";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, AlertCircle, XCircle, Users, UserCog, ListTodo } from "lucide-react";

export default function DashboardComp() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState([]);
  const [adminDetail, setAdminDetail] = useState([]);
  const fetchedRef = useRef(false);

  const userTaskFetch = async () => {
    const toastId = toast.loading("Fetching tasks...");
    try {
      const { data } = await axios.get("/api/user/get-tasks");
      toast.success("Have a great day!", { id: toastId });
      setTasks(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch tasks", { id: toastId });
    }
  };

  const assignedTaskFetch = async () => {
    const toastId = toast.loading("Fetching tasks...");
    try {
      const { data } = await axios.get("/api/manager/get-tasks");
      setTasks(data || []);
      toast.success("Have a great day!", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch tasks", { id: toastId });
    }
  };

  const totalUsers = async () => {
    const toastId = toast.loading("Fetching users...");
    try {
      const { data } = await axios.get("/api/admin/get-users");
      toast.success("Welcome, Admin!", { id: toastId });
      setAdminDetail(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users", { id: toastId });
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || fetchedRef.current) return;
    fetchedRef.current = true;

    if (session?.user?.role === "USER") userTaskFetch();
    else if (session?.user?.role === "MANAGER") assignedTaskFetch();
    else if (session?.user?.role === "ADMIN") totalUsers();
  }, [status, session?.user?.role, session?.user?.id]);

  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const delayedCount = tasks.filter((t) => t.status === "Delayed").length;
  const closedCount = tasks.filter((t) => t.status === "Closed").length;
  const countUsers = adminDetail.filter((d) => d.role === "USER").length;
  const countManagers = adminDetail.filter((d) => d.role === "MANAGER").length;

  const role = session?.user?.role;
  const statItems = [
    { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-500" },
    { label: "Delayed", value: delayedCount, icon: AlertCircle, color: "text-orange-500" },
    { label: "Closed", value: closedCount, icon: XCircle, color: "text-red-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="card-surface overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
            <h1 className="page-header mt-1">
              Welcome, <span className="gradient-text capitalize">{session?.user?.name}</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {role === "USER"
                ? "Review your assigned tasks and submit reports."
                : role === "ADMIN"
                  ? "Manage team structure and user roles."
                  : "Create tasks and track your team's progress."}
            </p>
          </div>
          <div className="mt-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary md:mt-0">
            {role === "ADMIN" ? <Users className="size-7" /> : role === "MANAGER" ? <UserCog className="size-7" /> : <ListTodo className="size-7" />}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card-surface flex flex-col items-center justify-center p-8 md:col-span-1">
          <p className="text-sm font-medium text-muted-foreground">
            {role === "ADMIN" ? "Total employees" : "Total tasks"}
          </p>
          <NumberTicker
            value={role === "ADMIN" ? Math.max(adminDetail.length - 1, 0) : tasks.length}
            className="mt-2 text-5xl font-bold text-primary"
          />
        </div>

        <div className="card-surface p-6 md:col-span-1 lg:col-span-2">
          {role === "ADMIN" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-muted/50 p-5 text-center transition-colors duration-200 hover:bg-muted">
                <p className="text-sm text-muted-foreground">Users</p>
                <NumberTicker value={countUsers || 0} className="mt-2 text-3xl font-bold text-primary" />
              </div>
              <div className="rounded-2xl bg-muted/50 p-5 text-center transition-colors duration-200 hover:bg-muted">
                <p className="text-sm text-muted-foreground">Managers</p>
                <NumberTicker value={countManagers} className="mt-2 text-3xl font-bold text-primary" />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {statItems.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="stat-pill">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${color}`} />
                    <span className="text-sm capitalize text-muted-foreground">{label}</span>
                  </div>
                  <NumberTicker value={value} className="text-lg font-semibold text-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
