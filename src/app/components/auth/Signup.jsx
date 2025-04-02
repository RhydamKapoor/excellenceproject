"use client";
import { signupSchema } from "@/schemas/validation";
import axios from "axios";
import { Eye, EyeClosed, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function Signup() {
  const [messages, setMessages] = useState({
    errorMsg: '',
    loadMsg: ''
  });
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "USER" },
  });
  const [show, setShow] = useBoolToggle();
  const router = useRouter();

  const onSubmit = async (data) => {
    
    if (data) {
      const toastId = toast.loading("Processing...");
      setMessages({loadMsg: "Verifying..."});
      try {
        const res = await axios.post("/api/auth/signup", data);
        if (res.status === 200) {
          toast.success("Register successfully!", { id: toastId });
          router.push("/login");
          setMessages({loadMsg: ""});
        } else {
          toast.error(`Something went wrong!`, { id: toastId });
          setMessages({errorMsg: res?.error || "Auth error"})
        }
      } catch (error) {
        toast.error(error?.response?.data?.message, { id: toastId });
        console.log(error);
        setMessages({errorMsg: error?.response?.data?.message || "Auth error"})
      }
    }
  };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-y-7 w-3/5 items-center"
    >
      <div className="flex flex-col gap-y-2 text-[var(--withdarktext)]">
        <div className="flex sm:flex-row flex-col sm:*:w-1/2 *:w-full gap-x-3">
          <div className="flex flex-col">
            <div className="flex flex-col relative">
              <input
                type="text"
                id="firstName"
                className="capitalize w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                {...register("firstName")}
              />
              <label
                htmlFor="firstName"
                className={`"capitalize absolute top-1/2 -translate-y-1/2 left-5 bg-[var(--ourbackground)] px-1 transition-all duration-200 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 ${
                  watch("firstName") &&
                  `-translate-x-2 scale-90 -translate-y-8.5`
                }`}
              >
                First Name
              </label>
            </div>
            <p
              className={`${
                errors?.firstName ? `visible` : `invisible`
              } pl-2 text-red-500 text-sm`}
            >
              {errors?.firstName?.message || `Error`}
            </p>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col relative">
              <input
                type="text"
                id="lastName"
                className="capitalize w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
                {...register("lastName")}
              />
              <label
                htmlFor="lastName"
                className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                  watch("lastName") &&
                  `-translate-x-2 scale-90 -translate-y-8.5`
                }`}
              >
                last Name
              </label>
            </div>
            <p
              className={`${
                errors?.lastName ? `visible` : `invisible`
              } pl-2 text-red-500 text-sm`}
            >
              {errors?.lastName?.message || `Error`}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <div className="flex flex-col relative">
            <input
              type="text"
              id="email"
              className="lowercase w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"
              {...register("email")}
            />
            <label
              htmlFor="email"
              className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                watch("email") && `-translate-x-2 scale-90 -translate-y-8.5`
              }`}
            >
              email
            </label>
          </div>
          <p
            className={`${
              errors?.email ? `visible` : `invisible`
            } pl-2 text-red-500 text-sm`}
          >
            {errors?.email?.message || `Error`}
          </p>
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <div className="flex flex-col relative">
            <input
              type={!show ? "password" : "text"}
              id="password"
              className="w-full border rounded-full outline-none px-5 py-2.5 pr-14 peer text-[var(--withdarkinnertext)]"
              {...register("password")}
            />
            <label
              htmlFor="password"
              className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                watch("password") && `-translate-x-2 scale-90 -translate-y-8.5`
              }`}
            >
              password
            </label>
            <span className="absolute right-5 top-1/2 -translate-y-1/2">
              {show ? (
                <Eye size={20} onClick={() => setShow()} />
              ) : (
                <EyeClosed size={20} onClick={() => setShow()} />
              )}
            </span>
          </div>
          <p
            className={`${
              errors?.password ? `visible` : `invisible`
            } pl-2 text-red-500 text-sm`}
          >
            {errors?.password?.message || `Error`}
          </p>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-around">
            <Select
              defaultValue="USER"
              onValueChange={(value) => setValue("role", value)}
            >
              <SelectTrigger className="w-full rounded-full py-6 px-5 text-md text-[var(--withdarkinnertext)] capitalize">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="capitalize">
                  <SelectItem value="USER" defaultValue>
                    user
                  </SelectItem>
                  <SelectItem value="MANAGER">manager</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <p
            className={`${
              errors?.role ? `visible` : `invisible`
            } pl-2 text-red-500 text-sm`}
          >
            {errors?.role?.message || `Error`}
          </p>
        </div>
      </div>

      {/* Signup button  */}
      <div className="flex flex-col gap-y-4 items-center lg:w-full min-[400px]:w-3/4 w-full relative">
        <span className={` text-sm absolute -top-7 flex gap-x-1 items-center ${(messages.errorMsg || messages.loadMsg) ? `visible` : `invisible`}`}>
            {messages.errorMsg && <span className="text-red-500 flex justify-center items-center"><X size={18} strokeWidth={2.6}/>{messages.errorMsg}</span>}
            {messages.loadMsg && <span className="text-slate-700 animate-pulse flex justify-center items-center">{messages.loadMsg}</span>}
            <span className={` ${(messages.errorMsg || messages.loadMsg) ? `hidden` : `block`}`}>message</span>
          </span>
        <button
          type="submit"
          className="bg-[var(--secondary-color)] py-3 w-full text-[var(--dark-btn)] rounded-full font-bold cursor-pointer"
        >
          Create an account
        </button>
        <span className="text-[var(--lightText)] text-sm">- or -</span>

        <p className="text-[var(--lightText)] text-md">
          Already a user?{" "}
          <Link href="/login" className="text-[var(--dark-btn)]">
            Login
          </Link>
        </p>
      </div>
    </form>
  );
}
