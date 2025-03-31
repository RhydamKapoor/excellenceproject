'use client'

import { useSession } from "next-auth/react"

export default function EditProfile() {
    const {data: session} = useSession();
  return (
    <main className="flex items-center h-full">
      <div className="flex h-full w-full">
        <div className="flex justify-center items-center h-full w-1/4 py-6 border-r-2 shadow-lg">
            <span className="bg-[var(--specialtext)]/95 rounded-full w-60 h-6w-60 text-6xl tracking-wide uppercase text-white aspect-square flex justify-center items-center">{((session?.user?.firstName)?.charAt(0) || "" ) + ((session?.user?.lastName)?.charAt(0) || "")}</span>
        </div>
        <div className="w-3/4 flex flex-col justify-center items-center p-3 gap-y-10">
            {/* <div className="flex justify-center py-3">
                <h1 className="capitalize">Welcome, {(session?.user?.firstName) + " " + (session?.user?.lastName)}</h1>
                <h1 className="capitalize text-3xl text-[var(--dark-btn)] font-bold">Your profile</h1>
            </div> */}
            <div className="flex flex-col items-center w-3/5 gap-y-4 text-lg">
                <div className="flex items-center gap-x-5 w-full *:w-1/2 ">
                    <label className="text-[var(--specialtext)] font-semibold">Name:</label>
                    <h1 className="capitalize text-slate-800 text-base">{(session?.user?.firstName) + " " + (session?.user?.lastName)}</h1>
                </div>
                <div className="flex items-center gap-x-5 w-full *:w-1/2 ">
                    <label className="text-[var(--specialtext)] font-semibold">Email:</label>
                    <h1 className="text-slate-800 text-base">{session?.user?.email}</h1>
                </div>
                <div className="flex items-center gap-x-5 w-full *:w-1/2 ">
                    <label className="text-[var(--specialtext)] font-semibold">Role:</label>
                    <h1 className="capitalize text-slate-800 text-base flex gap-x-2">{session?.user?.role === "ADMIN" ? `Manage the roles of the employees` : session?.user?.role === "MANAGER" ? `Assign tasks to your employees` : `View your tasks`} ({(session?.user?.role).toLowerCase()})</h1>
                </div>
            </div>
        </div>
      </div>
    </main>
  )
}
