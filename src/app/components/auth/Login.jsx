"use client";

import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { FaSlack } from "react-icons/fa";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function Login({ onForgotPassword }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });
  const [show, setShow] = useBoolToggle();
  const router = useRouter();

  const onSubmit = async (data) => {
    if (!data) return;
    const { email, password } = data;
    const toastId = toast.loading("Verifying credentials...");
    try {
      const res = await signIn("credentials", { redirect: false, email, password });
      if (res?.ok) {
        toast.success("Welcome back!", { id: toastId });
        router.push("/dashboard");
      } else {
        toast.error(res?.error || "Invalid email or password", { id: toastId });
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            id="email"
            className="input-field lowercase"
            placeholder="you@company.com"
            {...register("email")}
          />
          {errors?.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <button
              type="button"
              className="text-xs text-primary transition-colors hover:underline"
              onClick={() => onForgotPassword?.()}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              id="password"
              className="input-field pr-12"
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShow()}
            >
              {show ? <Eye size={18} /> : <EyeClosed size={18} />}
            </button>
          </div>
        </div>
      </div>

      <Button type="submit" className="h-10 w-full rounded-2xl font-semibold">
        Sign in
      </Button>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-card px-3">or continue with</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl text-xs sm:text-sm"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          <FcGoogle className="text-base" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl text-xs sm:text-sm"
          onClick={() => signIn("slack", { callbackUrl: "/dashboard" })}
        >
          <FaSlack className="text-base text-[#4A154B]" />
          Slack
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
