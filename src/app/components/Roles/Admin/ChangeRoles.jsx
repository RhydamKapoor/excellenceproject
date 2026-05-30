"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRole } from "@/context/RoleContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  Mail,
  Shield,
  UserCog,
  Users,
} from "lucide-react";

const ROLE_LABELS = {
  USER: "Employee",
  MANAGER: "Manager",
};

const ROLE_STYLES = {
  USER: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  MANAGER: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "USER", label: "Employees" },
  { id: "MANAGER", label: "Managers" },
];

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium leading-none ${
        ROLE_STYLES[role] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function ReplacementPersonButton({ person, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(person.id)}
      className={`flex w-full min-w-0 cursor-pointer flex-col rounded-lg border px-3 py-2 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
          : "border-border bg-background hover:bg-muted/50"
      }`}
    >
      <span className="truncate text-sm font-medium capitalize text-foreground">
        {person.firstName} {person.lastName}
      </span>
      <span className="truncate text-xs text-muted-foreground lowercase">
        {person.email}
      </span>
    </button>
  );
}

export default function ChangeRoles() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState(null);
  const [replacementId, setReplacementId] = useState("");
  const { setRoleUpdated } = useRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const manageableUsers = useMemo(
    () => users.filter((user) => user.role !== "ADMIN"),
    [users]
  );

  const employees = useMemo(
    () => manageableUsers.filter((user) => user.role === "USER"),
    [manageableUsers]
  );

  const managers = useMemo(
    () => manageableUsers.filter((user) => user.role === "MANAGER"),
    [manageableUsers]
  );

  const filteredUsers = useMemo(() => {
    if (filter === "ALL") return manageableUsers;
    return manageableUsers.filter((user) => user.role === filter);
  }, [manageableUsers, filter]);

  const replacementOptions = useMemo(() => {
    if (!selectedUser) return { users: [], managers: [] };
    return {
      users: manageableUsers.filter((u) => u.role === "USER"),
      managers: manageableUsers.filter(
        (u) => u.role === "MANAGER" && u.id !== selectedUser.id
      ),
    };
  }, [manageableUsers, selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin/get-users");
      setUsers(data ?? []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users");
    }
  };

  const openRoleChange = (user, newRole) => {
    setSelectedUser(user);
    setTargetRole(newRole);
    setReplacementId("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setTargetRole(null);
    setReplacementId("");
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !targetRole) return;

    if (targetRole === "USER" && !replacementId) {
      toast.error("Select who will replace this manager");
      return;
    }

    const toastId = toast.loading("Updating role...");
    try {
      const payload =
        targetRole === "MANAGER"
          ? { userId: selectedUser.id, newRole: "MANAGER" }
          : {
              userId: selectedUser.id,
              newRole: "USER",
              employeeId: replacementId,
            };

      await axios.post("/api/admin/update-role", payload);
      toast.success("Role updated successfully", { id: toastId });
      setRoleUpdated((prev) => !prev);
      closeDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating role", {
        id: toastId,
      });
    }
  };

  const isPromote = targetRole === "MANAGER";

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="stat-pill">
          <div>
            <p className="text-xs text-muted-foreground">Total manageable</p>
            <p className="text-xl font-bold text-foreground">
              {manageableUsers.length}
            </p>
          </div>
          <Users className="size-5 text-primary" />
        </div>
        <div className="stat-pill">
          <div>
            <p className="text-xs text-muted-foreground">Employees</p>
            <p className="text-xl font-bold text-foreground">{employees.length}</p>
          </div>
          <UserCog className="size-5 text-sky-600" />
        </div>
        <div className="stat-pill">
          <div>
            <p className="text-xs text-muted-foreground">Managers</p>
            <p className="text-xl font-bold text-foreground">{managers.length}</p>
          </div>
          <Shield className="size-5 text-violet-600" />
        </div>
      </div>

      {/* User table */}
      <div className="card-surface flex max-h-[620px] w-full min-w-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Team members</h2>
              <p className="text-xs text-muted-foreground">
                Promote employees to manager or reassign manager duties
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ id, label }) => {
                const count =
                  id === "ALL"
                    ? manageableUsers.length
                    : id === "USER"
                      ? employees.length
                      : managers.length;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto">
          <div className="w-full min-w-[720px]">
            <div className="grid grid-cols-[1.2fr_1.4fr_0.7fr_0.9fr] gap-3 border-b border-border bg-muted/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Name</span>
              <span>Email</span>
              <span className="flex items-center">Role</span>
              <span className="text-center">Action</span>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1.2fr_1.4fr_0.7fr_0.9fr] items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold uppercase text-muted-foreground">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </span>
                      <span className="truncate font-medium capitalize text-foreground">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>

                    <span className="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground">
                      <Mail className="size-3.5 shrink-0" />
                      {user.email}
                    </span>

                    <div className="flex items-center">
                      <RoleBadge role={user.role} />
                    </div>

                    <div className="flex justify-center">
                      {user.role === "USER" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg"
                          onClick={() => openRoleChange(user, "MANAGER")}
                        >
                          <ArrowUp className="size-3.5" />
                          Promote
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg"
                          onClick={() => openRoleChange(user, "USER")}
                        >
                          <ArrowDown className="size-3.5" />
                          Demote
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <Users className="size-9 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No users in this view
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role change dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl sm:w-full">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  {isPromote ? "Promote to manager" : "Change manager to employee"}
                </DialogTitle>
                <DialogDescription className="text-left text-xs sm:text-sm">
                  {selectedUser && (
                    <>
                      {isPromote ? (
                        <>
                          <span className="font-medium capitalize text-foreground">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </span>{" "}
                          will become a manager and can assign tasks to their team.
                        </>
                      ) : (
                        <>
                          Choose who will take over{" "}
                          <span className="font-medium capitalize text-foreground">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </span>
                          &apos;s team and responsibilities.
                        </>
                      )}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>

          {!isPromote && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-6">
              <label className="shrink-0 text-xs font-medium text-muted-foreground">
                Select replacement manager
              </label>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {/* Employees column */}
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/20">
                  <div className="shrink-0 border-b border-border px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Employees
                    </p>
                  </div>
                  <div className="flex max-h-[min(160px,28dvh)] flex-col gap-1.5 overflow-y-auto p-2 sm:max-h-[220px]">
                    {replacementOptions.users.length > 0 ? (
                      replacementOptions.users.map((person) => (
                        <ReplacementPersonButton
                          key={person.id}
                          person={person}
                          selected={replacementId === person.id}
                          onSelect={setReplacementId}
                        />
                      ))
                    ) : (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        No employees available
                      </p>
                    )}
                  </div>
                </div>

                {/* Managers column */}
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/20">
                  <div className="shrink-0 border-b border-border px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Managers
                    </p>
                  </div>
                  <div className="flex max-h-[min(160px,28dvh)] flex-col gap-1.5 overflow-y-auto p-2 sm:max-h-[220px]">
                    {replacementOptions.managers.length > 0 ? (
                      replacementOptions.managers.map((person) => (
                        <ReplacementPersonButton
                          key={person.id}
                          person={person}
                          selected={replacementId === person.id}
                          onSelect={setReplacementId}
                        />
                      ))
                    ) : (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        No other managers available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="shrink-0 text-xs text-muted-foreground">
                Their assigned employees and tasks will move to the selected person.
              </p>
            </div>
          )}

            <DialogFooter className="shrink-0 gap-2 border-t border-border px-4 py-4 sm:px-6 sm:py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full rounded-xl font-semibold sm:w-auto"
                onClick={confirmRoleChange}
              >
                {isPromote ? "Confirm promotion" : "Confirm change"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
