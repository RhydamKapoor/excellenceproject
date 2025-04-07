"use client";
import { Eye, EyeClosed, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { loginSchema } from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import ForgotPassword from "./ForgotPassword";
import { FcGoogle } from "react-icons/fc";
import { FaSlack } from "react-icons/fa";

export default function Login() {
  const {data: session} = useSession();
  const [forgotPassword, setForgotPassword] = useState(false);
  const [messages, setMessages] = useState({
    errorMsg: '',
    loadMsg: '',
    successMsg: ''
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const [show, setShow] = useBoolToggle();
  const router = useRouter();

  const onSubmit = async (data) => {

    if (data) {
      const { email, password } = data;

      // const toastId = toast.loading("Processing...");
      setMessages({loadMsg: "Verifying..."});
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        if (res?.ok) {
          // toast.success("Login successful!", { id: toastId });
          setMessages({successMsg: "Login successfully!"});
          router.push("/dashboard");
        } else {
          // toast.error(res?.error || `Something went wrong!`, { id: toastId });
          setMessages({errorMsg: res?.error || "Auth error"})
        }
      } catch (error) {
        // toast.error(res.error || "Auth error", { id: toastId });
        setMessages({errorMsg: res?.error || "Auth error"})
        console.log(error);
      }
    }
  };

  useEffect(() => {
    console.log(session);
  }, [session]);

  return (
    <>
      {
        !forgotPassword ?

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-y-7 md:w-3/5 w-3/4 max-[500px]:w-full px-5 lg:px-0 items-center"
        >
          <div className="flex flex-col gap-y-2 w-full text-[var(--withdarktext)]">
            {/* Email */}
            <div className="flex flex-col">
              <div className="flex flex-col relative">
                <input
                  type="text"
                  id="email"
                  className="w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)] lowercase"
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
              <p className={`${
                    errors?.email ? `visible` : `invisible`
                  } pl-2 text-red-500 text-sm`}
                >
                  {errors?.email?.message || `Error`}
                </p>
            </div>

            {/* password */}
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
                <span className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer">
                  {show ? (
                    <Eye size={20} onClick={() => setShow()} />
                  ) : (
                    <EyeClosed size={20} onClick={() => setShow()} />
                  )}
                </span>
              </div>
              <div className="flex justify-end px-4">
                  <button type="button" className="text-sm cursor-pointer" onClick={() => setForgotPassword(true)}>Forgot Password?</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-y-4 items-center w-full relative">
          <span className={` text-sm absolute -top-7 flex gap-x-1 items-center ${(messages.errorMsg || messages.loadMsg) ? `visible` : `invisible`}`}>
            {messages.errorMsg && <span className="text-red-500 flex justify-center items-center"><X size={18} strokeWidth={2.6}/>{messages.errorMsg}</span>}
            {messages.loadMsg && <span className="text-slate-700 animate-pulse flex justify-center items-center">{messages.loadMsg}</span>}
            {messages.successMsg && <span className="text-green-600 animate-pulse flex justify-center items-center">{messages.successMsg}</span>}
            <span className={` ${(messages.errorMsg || messages.loadMsg) ? `hidden` : `block`}`}>message</span>
          </span>
            <button
              type="submit"
              className="bg-[var(--secondary-color)] py-3 w-full text-[var(--dark-btn)] rounded-full font-bold cursor-pointer"
            >
              Login
            </button>
            <span className="text-[var(--lightText)] text-sm">- or -</span>

            <div className="flex max-[1160px]:flex-col items-center justify-center w-full *:w-1/2 max-[1160px]:*:w-full text-sm gap-x-5 gap-y-3 *:cursor-pointer">
              <button type="button" onClick={() => signIn('google', {callbackUrl: '/dashboard'})}
              className="w-full flex justify-center items-center gap-x-2 text-white py-2.5 px-2 rounded-full border border-gray-700">
                <FcGoogle className="text-lg" />
                <span className="text-gray-700 font-semibold">Login with Google</span>
              </button>
              <button type="button" onClick={() => signIn('slack', {callbackUrl: '/dashboard'})} className="w-full flex justify-center items-center gap-x-2 text-white py-2.5 px-2 rounded-full border border-gray-700"
              >
                <FaSlack className="text-purple-600 text-lg" />
                <span className="text-gray-700 font-semibold">Login with Slack</span>
              </button>
            </div>

            <p className="text-[var(--lightText)] text-sm">
              New user?{" "}
              <Link href="/signup" className="text-[var(--dark-btn)] font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </form>
        :
        <ForgotPassword setForgotPassword={setForgotPassword}/>
      }
    </>
  );
}
