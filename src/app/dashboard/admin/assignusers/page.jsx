import AssignUsers from "@/app/components/Roles/Admin/AssignUsers";

export default function AssignUserPage() {
  return (
    <main className="flex flex-col gap-y-5 items-center p-5 max-[400px]:py-5 max-[400px]:px-2 h-full"> 
      <div className="flex justify-center">
        <h1 className="text-2xl text-[var(--lightText)] font-bold flex gap-x-3 items-center max-[400px]:text-xl">Assigning employees to manager</h1>
      </div>
      <AssignUsers />
    </main>
  )
}
