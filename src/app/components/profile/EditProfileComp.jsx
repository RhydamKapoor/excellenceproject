"use client";

import { editSchema } from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { Eye, EyeClosed, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function EditProfileComp() {
  const [show, setShow] = useBoolToggle();
  const { data: session, update } = useSession();
  // console.log(session);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: session?.user?.firstName,
      lastName: session?.user?.lastName,
      email: session?.user?.email,
      oldPassword: "A@a123",
    },
    resolver: zodResolver(editSchema),
  });
  const [sections, setSections] = useState({
    disable: true,
    verification: false,
  });

  
  const verifyingPassword = async (data) => {
    if (!sections.disable && sections.verification) {
      editProfile(data);
      // console.log(data);
    } else {
      setSections({ ...sections, verification: true });
      setValue("oldPassword", "");
    }
  };

  const editProfile = async (data) => {
    if (data) {
      const toastId = toast.loading(`Saving changes...`);
      try {
        const res = await axios.put("/api/edit-profile/update", {
          ...data,
          id: session?.user?.id,
        });
        if (res.status === 200) {
          toast.success("Profile updated successfully!", { id: toastId });
          await update({
            ...session,
            user: {
              ...session.user,
              firstName: res?.data?.firstName,
              lastName: res?.data?.lastName,
              email: res?.data?.email,
            },
          });
          setSections({ disable: true, verification: false });
          setValue("newPassword", "");
        } else {
          toast.error(`Something went wrong!`, { id: toastId });
        }
      } catch (error) {
        toast.error(error?.response?.data?.message, { id: toastId });
        console.log(error);
      }
    }
  };
  return (
    <div className="flex max-md:flex-col h-full w-full max-md:gap-y-8 relative">
      <span
        className="absolute top-3 right-4 cursor-pointer"
        onClick={() => signOut()}
      >
        <LogOut
          size={32}
          className="bg-red-600 text-slate-100 rounded-full p-1.5"
        />
      </span>
      <div className="flex flex-col justify-center items-center gap-y-7 max-sm:gap-y-5 h-full w-1/4 max-md:w-full max-md:h-1/4 py-6 border-r-2 shadow-lg">
        <span className="bg-[var(--specialtext)]/95 rounded-full w-60 h-6w-60 max-lg:w-44 max-lg:h-44 max-md:w-24 max-md:h-24 text-6xl max-md:text-3xl tracking-wide uppercase text-white aspect-square flex justify-center items-center">
          {(session?.user?.firstName?.charAt(0) || "") +
            (session?.user?.lastName?.charAt(0) || "")}
        </span>

        <button
          className="bg-[var(--dark-btn)] text-white py-2 md:w-2/3 max-md:w-1/2 rounded-full text-sm flex gap-x-1 justify-center items-center cursor-pointer capitalize"
          onClick={() => setSections({ ...sections, disable: false })}
        >
          <Settings size={18} />
          Edit profile
        </button>
      </div>
      <div className="w-3/4 max-md:w-full flex flex-col justify-center items-center p-3 gap-y-10">
        {/* <div className="flex justify-center py-3">
            <h1 className="capitalize">Welcome, {(session?.user?.firstName) + " " + (session?.user?.lastName)}</h1>
            <h1 className="capitalize text-3xl text-[var(--dark-btn)] font-bold">Your profile</h1>
        </div> */}
        <form
          className={`flex flex-col items-center w-1/2 max-md:w-full *:w-full ${
            sections.disable ? `gap-y-6` : `gap-y-4`
          } text-lg`}
        >
          {!sections.verification && (
            <>
              <div
                className={`flex sm:flex-row flex-col ${
                  sections.disable ? `max-sm:gap-y-6` : `max-sm:gap-y-4`
                } sm:*:w-1/2 gap-x-3`}
              >
                {/* FirstName */}
                <div className="flex flex-col">
                  <div className="flex flex-col relative">
                    <input
                      type="text"
                      id="firstName"
                      className="capitalize border border-[var(--dark-btn)] rounded-lg outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                      {...register("firstName")}
                      defaultValue={session?.user?.firstName || ""}
                      disabled={sections.disable}
                    />
                    <label
                      htmlFor="firstName"
                      className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-9.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                        (session?.user?.firstName || watch("firstName")) &&
                        `-translate-x-2 scale-90 -translate-y-9.5`
                      }`}
                    >
                      First Name
                    </label>
                  </div>
                  {!sections.disable && (
                    <p
                      className={`${
                        errors?.firstName ? `visible` : `invisible`
                      } pl-2 text-red-500 text-sm`}
                    >
                      {errors?.firstName?.message || `Error`}
                    </p>
                  )}
                </div>
                {/* LastName */}
                <div className="flex flex-col">
                  <div className="flex flex-col relative">
                    <input
                      type="text"
                      id="lastName"
                      className="capitalize w-full  border border-[var(--dark-btn)] rounded-lg outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                      {...register("lastName")}
                      defaultValue={session?.user?.lastName || ""}
                      disabled={sections.disable}
                    />
                    <label
                      htmlFor="lastName"
                      className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-9.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                        (session?.user?.lastName || watch("lastName")) &&
                        `-translate-x-2 scale-90 -translate-y-9.5`
                      }`}
                    >
                      last Name
                    </label>
                  </div>
                  {!sections.disable && (
                    <p
                      className={`${
                        errors?.lastName ? `visible` : `invisible`
                      } pl-2 text-red-500 text-sm`}
                    >
                      {errors?.lastName?.message || `Error`}
                    </p>
                  )}
                </div>
              </div>
              {/* Email */}
              <div className="flex flex-col relative w-full">
                <div className="flex flex-col relative">
                  <input
                    type="text"
                    id="email"
                    className="lowercase w-full border border-[var(--dark-btn)] rounded-md outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                    {...register("email")}
                    defaultValue={session?.user?.email || ""}
                    disabled={sections.disable}
                  />
                  <label
                    htmlFor="email"
                    className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-9.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                      (session?.user?.email || watch("email")) &&
                      `-translate-x-2 scale-90 -translate-y-9.5`
                    }`}
                  >
                    email
                  </label>
                </div>
                {!sections.disable && (
                  <p
                    className={`${
                      errors?.email ? `visible` : `invisible`
                    } pl-2 text-red-500 text-sm`}
                  >
                    {errors?.email?.message || `Error`}
                  </p>
                )}
              </div>
              {/* NewPassword */}
              {!sections.disable && (
                <div className="flex flex-col">
                  <div className="flex flex-col relative">
                    <input
                      type={!show ? "password" : "text"}
                      id="newPassword"
                      className="w-full border border-[var(--dark-btn)] rounded-md outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                      {...register("newPassword")}
                    />
                    <label
                      htmlFor="newPassword"
                      className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-9.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200  ${
                        watch("newPassword") &&
                        `-translate-x-2 scale-90 -translate-y-8.5`
                      }`}
                    >
                      set a password
                    </label>
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--specialtext)] cursor-pointer">
                      {show ? (
                        <Eye size={20} onClick={() => setShow()} />
                      ) : (
                        <EyeClosed size={20} onClick={() => setShow()} />
                      )}
                    </span>
                  </div>
                  <p
                    className={`${
                      errors?.newPassword ? `visible` : `invisible`
                    } pl-2 text-red-500 text-sm`}
                  >
                    {errors?.newPassword?.message || `Error`}
                  </p>
                </div>
              )}
            </>
          )}

          {sections.disable ? (
            !sections.verification && (
              <>
                {/* Role */}
                <div className="flex flex-col relative">
                  <input
                    type="text"
                    id="role"
                    className="capitalize w-full border border-[var(--dark-btn)] rounded-md outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                    defaultValue={session?.user?.role?.toLowerCase() || ""}
                    disabled
                  />
                  <label
                    htmlFor="email"
                    className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-9.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                      session?.user?.role &&
                      `-translate-x-2 scale-90 -translate-y-9.5`
                    }`}
                  >
                    Role
                  </label>
                </div>
                {/* Account Created */}
                <div className="flex flex-col relative">
                  <input
                    type="text"
                    id="createdAt"
                    className="capitalize w-full border border-[var(--dark-btn)] rounded-md outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                    defaultValue={
                      session?.user?.createdAt
                        ? format(
                            new Date(session?.user?.createdAt),
                            "dd MMM yyyy"
                          )
                        : "N/A" || ""
                    }
                    disabled
                  />
                  <label
                    htmlFor="createdAt"
                    className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-9.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                      session?.user?.createdAt &&
                      `-translate-x-2 scale-90 -translate-y-9.5`
                    }`}
                  >
                    Account Created
                  </label>
                </div>
              </>
            )
          ) : !sections.disable && !sections.verification ? (
            <div className="flex justify-center gap-x-4 *:w-1/3 text-white *:cursor-pointer">
              <button
                type="button"
                className="bg-[var(--dark-btn)] py-2 text-sm rounded-full"
                onClick={handleSubmit(verifyingPassword)}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="border border-[var(--dark-btn)] text-[var(--dark-btn)] py-2 text-sm rounded-full"
                onClick={() => setSections({ ...sections, disable: true })}
              >
                Discard
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <div className="flex flex-col relative">
                  <input
                    type={!show ? "password" : "text"}
                    id="oldPassword"
                    className="w-full border border-[var(--dark-btn)] rounded-md outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                    {...register("oldPassword")}
                  />
                  <label
                    htmlFor="oldPassword"
                    className={`text-[var(--specialtext)] capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-10 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200  ${
                      watch("oldPassword") &&
                      `-translate-x-2 scale-90 -translate-y-10`
                    }`}
                  >
                    Your login password
                  </label>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--specialtext)] cursor-pointer">
                    {show ? (
                      <Eye size={20} onClick={() => setShow()} />
                    ) : (
                      <EyeClosed size={20} onClick={() => setShow()} />
                    )}
                  </span>
                </div>
                <p
                  className={`${
                    errors?.oldPassword ? `visible` : `invisible`
                  } pl-2 text-red-500 text-sm`}
                >
                  {errors?.oldPassword?.message || `Error`}
                </p>
              </div>
              <div className="flex justify-center gap-x-4 *:w-1/3 text-white *:cursor-pointer">
                <button
                  type="Submit"
                  className="bg-[var(--dark-btn)] py-2 text-sm rounded-full"
                  onClick={handleSubmit(verifyingPassword)}
                >
                  Verify
                </button>
                <button
                  type="button"
                  className="border border-[var(--dark-btn)] text-[var(--dark-btn)] py-2 text-sm rounded-full"
                  onClick={() => {
                    setValue("oldPassword", "A@a123"),
                      setSections({ verification: false, disable: true });
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
