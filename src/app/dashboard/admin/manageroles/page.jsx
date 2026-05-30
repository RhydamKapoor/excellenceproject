import ChangeRoles from "@/app/components/Roles/Admin/ChangeRoles";

export default function Workers() {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
      <div>
        <h1 className="page-header">Manage roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promote employees to managers or reassign manager responsibilities.
        </p>
      </div>
      <ChangeRoles />
    </div>
  );
}
