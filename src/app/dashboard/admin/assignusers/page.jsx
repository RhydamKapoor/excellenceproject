import AssignUsers from "@/app/components/Roles/Admin/AssignUsers";

export default function AssignUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Assign employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a manager and assign employees to their team.
        </p>
      </div>
      <AssignUsers />
    </div>
  );
}
