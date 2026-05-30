"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Briefcase,
  Mail,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AssignUsers() {
  const [users, setUsers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [assignUserId, setAssignUserId] = useState("");

  const managers = users.filter((user) => user.role === "MANAGER");
  const employees = users.filter((user) => user.role === "USER");
  const unassignedEmployees = employees.filter((user) => !user.managerId);
  const selectedManager = managers.find((m) => m.id === selectedManagerId);
  const assignedToManager = employees.filter(
    (user) => user.managerId === selectedManagerId
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedManagerId) return;
    const firstManager = users.find((u) => u.role === "MANAGER");
    if (firstManager) setSelectedManagerId(firstManager.id);
  }, [users, selectedManagerId]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin/get-users");
      setUsers(data ?? []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users");
    }
  };

  const assignUser = async () => {
    if (!selectedManagerId) {
      toast.error("Select a manager first");
      return;
    }
    if (!assignUserId) {
      toast.error("Select an employee to assign");
      return;
    }

    const toastId = toast.loading("Assigning employee...");
    try {
      const res = await axios.post("/api/admin/assign-user", {
        userId: assignUserId,
        managerId: selectedManagerId,
      });
      if (res.status === 200) {
        toast.success("Employee assigned successfully", { id: toastId });
        setAssignUserId("");
        fetchUsers();
      } else {
        toast.error("Failed to assign employee", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign employee", {
        id: toastId,
      });
    }
  };

  const removeUser = async (userId) => {
    const toastId = toast.loading("Removing employee...");
    try {
      const res = await axios.post("/api/admin/remove-user", {
        userId,
        managerId: selectedManagerId,
      });
      if (res.status === 200) {
        toast.success("Employee removed from team", { id: toastId });
        fetchUsers();
      } else {
        toast.error("Failed to remove employee", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove employee", {
        id: toastId,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="stat-pill">
          <div>
            <p className="text-xs text-muted-foreground">Managers</p>
            <p className="text-xl font-bold text-foreground">{managers.length}</p>
          </div>
          <Briefcase className="size-5 text-primary" />
        </div>
        <div className="stat-pill">
          <div>
            <p className="text-xs text-muted-foreground">Unassigned employees</p>
            <p className="text-xl font-bold text-foreground">{unassignedEmployees.length}</p>
          </div>
          <Users className="size-5 text-amber-600" />
        </div>
        <div className="stat-pill">
          <div>
            <p className="text-xs text-muted-foreground">Total employees</p>
            <p className="text-xl font-bold text-foreground">{employees.length}</p>
          </div>
          <UsersRound className="size-5 text-violet-500" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        {/* Manager list */}
        <div className="card-surface flex max-h-[560px] flex-col overflow-hidden lg:col-span-2">
          <div className="shrink-0 border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Managers</h2>
            <p className="text-xs text-muted-foreground">
              Select a manager to manage their team
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col divide-y divide-border">
            {managers.length > 0 ? (
              managers.map((manager) => {
                const teamCount = employees.filter(
                  (u) => u.managerId === manager.id
                ).length;
                const isSelected = selectedManagerId === manager.id;

                return (
                  <button
                    key={manager.id}
                    type="button"
                    onClick={() => {
                      setSelectedManagerId(manager.id);
                      setAssignUserId("");
                    }}
                    className={`flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`uppercase flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {manager.firstName?.[0]}
                      {manager.lastName?.[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium capitalize text-foreground">
                        {manager.firstName} {manager.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {manager.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isSelected
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {teamCount} {teamCount === 1 ? "member" : "members"}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                No managers found. Promote a user to manager first.
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Team management panel */}
        <div className="card-surface flex max-h-[560px] flex-col overflow-hidden lg:col-span-3">
          {selectedManager ? (
            <>
              <div className="shrink-0 border-b border-border px-6 py-4">
                <h2 className="font-semibold capitalize text-foreground">
                  {selectedManager.firstName} {selectedManager.lastName}&apos;s team
                </h2>
                <p className="text-xs text-muted-foreground">
                  Assign unassigned employees or remove existing team members
                </p>
              </div>

              {/* Assign form */}
              <div className="shrink-0 border-b border-border bg-muted/20 px-6 py-5">
                <div className="mb-3 flex items-center gap-2">
                  <UserPlus className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Add employee to team
                  </h3>
                </div>

                {unassignedEmployees.length > 0 ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Unassigned employee
                      </label>
                      <Select value={assignUserId} onValueChange={setAssignUserId}>
                        <SelectTrigger className="h-10 w-full rounded-lg border border-input bg-background px-4 text-sm shadow-none">
                          <SelectValue placeholder="Choose an employee..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectGroup>
                            {unassignedEmployees.map((user) => (
                              <SelectItem key={user.id} value={user.id} className="cursor-pointer">
                                <span className="capitalize">{user.firstName} {user.lastName}</span> <span className="text-xs text-muted-foreground">({user.email})</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      className="h-10 shrink-0 rounded-xl px-6 font-semibold sm:w-auto"
                      onClick={assignUser}
                    >
                      Assign to team
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    All employees are currently assigned to a manager.
                  </p>
                )}
              </div>

              {/* Team list */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Current team members
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {assignedToManager.length} assigned
                  </span>
                </div>

                {assignedToManager.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <div className="min-w-[480px]">
                      <div className="grid grid-cols-[1.2fr_1.5fr_0.6fr] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>Name</span>
                        <span>Email</span>
                        <span className="text-center">Action</span>
                      </div>
                      <div className="divide-y divide-border">
                        {assignedToManager.map((user) => (
                          <div
                            key={user.id}
                            className="grid grid-cols-[1.2fr_1.5fr_0.6fr] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                          >
                            <span className="truncate font-medium capitalize text-foreground">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                              <Mail className="size-3.5 shrink-0" />
                              {user.email}
                            </span>
                            <div className="flex justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() => removeUser(user.id)}
                              >
                                <UserMinus className="size-3.5" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
                    <Users className="size-9 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No employees assigned yet
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Use the form above to add unassigned employees to this
                      manager&apos;s team.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Briefcase className="size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Select a manager
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Choose a manager from the list to view and manage their team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
