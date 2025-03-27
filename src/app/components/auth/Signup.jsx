'use client'
import axios from "axios";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";


export default function Signup() {
    const {register, handleSubmit, watch} = useForm();
    const [show, setShow] = useBoolToggle();
    const router = useRouter()

    const onSubmit = async (data) => {
      console.log(data);
      
      if (data) {
        const toastId = toast.loading("Processing...");
        try {
          const res = await axios.post("/api/auth/signup", data);
          if (res.status === 200) {
            toast.success("Register successfully!", { id: toastId });
            router.push("/login");
          } else {
            toast.error(`Something went wrong!`, { id: toastId });
          }
        } catch (error) {
          toast.error(error.response.data.message, { id: toastId });
          console.log(error);
        }
      }
    };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-y-7 w-3/5 items-center"
    >
      <div className="flex flex-col gap-y-5 text-[var(--withdarktext)]">

        <div className="flex *:w-1/2 gap-x-3">
            <div className="flex flex-col">
                <div className="flex flex-col relative">
                    <input type="text" id="firstName" className="capitalize w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"  {...register('firstName')}/>
                    <label htmlFor="firstName" className={`"capitalize absolute top-1/2 -translate-y-1/2 left-5 bg-[var(--background)] px-1 transition-all duration-200 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 ${watch("firstName") && `-translate-x-2 scale-90 -translate-y-8.5`}`}>First Name</label>
                </div>
            </div>
            <div className="flex flex-col">
                <div className="flex flex-col relative">
                    <input type="text" id="lastName" className="capitalize w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]"  {...register('lastName')}/>
                    <label htmlFor="lastName" className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--background)] px-1 transition-all duration-200 ${watch("lastName") && `-translate-x-2 scale-90 -translate-y-8.5`}`}>last Name</label>
                </div>
            </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
            <div className="flex flex-col relative">
                <input type="text" id="email" className="lowercase w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)]" {...register('email')}/>
                <label htmlFor="email" className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--background)] px-1 transition-all duration-200 ${watch("email") && `-translate-x-2 scale-90 -translate-y-8.5`}`}>email</label>
            </div>
        </div>

        {/* Password */}
        <div className="flex flex-col">
            <div className="flex flex-col relative">
                <input type={!show ? "password" : "text"} id="password" className="w-full border rounded-full outline-none px-5 py-2.5 pr-14 peer text-[var(--withdarkinnertext)]" {...register('password')}/>
                <label htmlFor="password" className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--background)] px-1 transition-all duration-200 ${watch("password") && `-translate-x-2 scale-90 -translate-y-8.5`}`}>password</label>
                <span className="absolute right-5 top-1/2 -translate-y-1/2">{show ? <Eye size={20} onClick={() => setShow()}/> : <EyeClosed  size={20} onClick={() => setShow()}/>}</span>
            </div>
        </div>

        <div className="flex justify-around">
          <div className="flex gap-x-2">
            <label htmlFor="user">User</label>
            <input type="radio" name="role" id="user" value="USER" {...register("role")} defaultChecked/>
          </div>
          <div className="flex gap-x-2">
            <label htmlFor="manager">Manager</label>
            <input type="radio" name="role" id="manager" value="MANAGER" {...register("role")}  />
          </div>
          <div className="flex gap-x-2">
            <label htmlFor="admin">Admin</label>
            <input type="radio" name="role" id="admin" value="ADMIN" {...register("role")}  />
          </div>
        </div>

      </div> 

      {/* Signup button  */}
      <div className="flex flex-col gap-y-4 items-center w-full">
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
  )
}
