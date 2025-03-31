"use client";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Login() {
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

      const toastId = toast.loading("Processing...");
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        if (res?.ok) {
          toast.success("Login successful!", { id: toastId });
          router.push("/dashboard");
        } else {
          toast.error(res?.error || "Invalid credentials", { id: toastId });
        }
      } catch (error) {
        toast.error(res.error || "Auth error", { id: toastId });
        console.log(error);
      }
    }
  };
  return (
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
            <span className="absolute right-5 top-1/2 -translate-y-1/2">
              {show ? (
                <Eye size={20} onClick={() => setShow()} />
              ) : (
                <EyeClosed size={20} onClick={() => setShow()} />
              )}
            </span>
          </div>
          <div className="flex justify-end px-4">
            <Link href={`/forgotPassword`} className="text-sm">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-y-4 items-center w-full">
        <button
          type="submit"
          className="bg-[var(--secondary-color)] py-3 w-full text-[var(--dark-btn)] rounded-full font-bold cursor-pointer"
        >
          Login
        </button>
        <span className="text-[var(--lightText)] text-sm">- or -</span>

        <p className="text-[var(--lightText)] text-md">
          New user?{" "}
          <Link href="/signup" className="text-[var(--dark-btn)]">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
