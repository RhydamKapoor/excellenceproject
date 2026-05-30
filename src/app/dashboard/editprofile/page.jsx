import EditProfileComp from "@/app/components/profile/EditProfileComp";

export default function EditProfile() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      <EditProfileComp />
    </div>
  );
}
