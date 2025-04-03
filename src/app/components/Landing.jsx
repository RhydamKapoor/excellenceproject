"use client";
import Link from "next/link";

export default function Landing({session}) {
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-y-10 items-center text-center p-10 max-[900px]:p-4">
      <div className="flex flex-col">
        <h1 className="text-4xl max-[400px]:text-3xl font-bold text-[var(--specialtext)]">
          Task Manager
        </h1>
        <p className="text-gray-600 mt-4 text-base max-w-md max-[400px]:text-sm">
          Effortlessly manage tasks, assign responsibilities, and track progress
          with ease.
        </p>
      </div>

      <div className="flex gap-4 w-full justify-center max-[460px]:flex-col items-center">
        {session ? (
          <Link href={`/dashboard`} className="bg-[var(--dark-btn)] text-white px-6 py-2 rounded-full w-1/2 max-md:w-2/3 max-[400px]:!w-full">
            Get started
          </Link>
        ) : (
          <>
            <Link href="/login" className="w-1/3 max-[460px]:w-full *:cursor-pointer">
              <button className="bg-[var(--dark-btn)] text-white px-6 py-2 rounded-full w-full">
                Login
              </button>
            </Link>
            <Link href="/signup" className="w-1/3 max-[460px]:w-full *:cursor-pointer">
              <button
                variant="outline"
                className="border border-[var(--dark-btn)] text-[var(--dark-btn)] px-6 py-2 rounded-full w-full"
              >
                Sign Up
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
