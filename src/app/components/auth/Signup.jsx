"use client";

import { signupSchema } from "@/schemas/validation";
import axios from "axios";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function Signup() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "USER" },
  });
  const [show, setShow] = useBoolToggle();
  const router = useRouter();

  const onSubmit = async (data) => {
    if (!data) return;
    const toastId = toast.loading("Creating your account...");
    try {
      const res = await axios.post("/api/auth/signup", data);
      if (res.status === 200) {
        toast.success("Account created! Sign in to continue.", { id: toastId });
        router.push("/login");
      } else {
        toast.error(res?.error || "Could not create account", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not create account", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className="text-sm font-medium">First name</label>
          <input id="firstName" type="text" className="input-field capitalize" {...register("firstName")} />
          {errors?.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
          <input id="lastName" type="text" className="input-field capitalize" {...register("lastName")} />
          {errors?.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" type="email" className="input-field lowercase" {...register("email")} />
        {errors?.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            className="input-field pr-12"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShow()}
          >
            {show ? <Eye size={18} /> : <EyeClosed size={18} />}
          </button>
        </div>
        {errors?.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Role</label>
        <Select defaultValue="USER" onValueChange={(value) => setValue("role", value)}>
          <SelectTrigger className="h-10 w-full rounded-lg border border-input bg-background px-4 text-sm font-normal shadow-none focus:border-primary focus:ring-2 focus:ring-primary/20">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectGroup>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors?.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <Button type="submit" className="h-10 w-full rounded-2xl font-semibold">
        Create account
      </Button>

      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
