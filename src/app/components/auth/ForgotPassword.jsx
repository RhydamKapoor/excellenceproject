"use client";
import { emailVerificationSchema } from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Eye, EyeClosed, MoveLeft } from "lucide-react";
import { useState } from "react";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function ForgotPassword({ setForgotPassword }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(emailVerificationSchema),
  });
  const [verifyOtp, setVerifyOtp] = useState({
    sent: false,
    verify: false
  });
    const [show, setShow] = useBoolToggle();
    const [error, setError] = useState([])


  const isValidEmail = (email) => {
    // Regular expression for validating email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  const validatePassword = (password) => [
    password.length < 4 && "Password must be at least 4 characters",
    password.length > 20 && "Password must be less than 20 characters",
    !/[A-Z]/.test(password) && "Password must contain at least one uppercase letter",
    !/[a-z]/.test(password) && "Password must contain at least one lowercase letter",
    !/[!@#$%^&*(),.?":{}|<>]/.test(password) && "Password must contain at least one special character",
    !/[0-9]/.test(password) && "Password must contain at least one numeric value",
    password.trim() === "" && "Enter the password"
  ].filter(Boolean);
  
  const sendOtp = async (e) => {
    e.preventDefault(); 
    const email = watch('email')?.toLowerCase();

    if (!isValidEmail(email)) {
        toast.error("Invalid email address");
        return;
      }
      
    const toastId = toast.loading(`Sending OTP...`);
    try {
      const res = await axios.post('/api/auth/forgot-password/send-otp', { email });

      if (res.status === 200) {
        toast.success(`OTP sent successfully`, { id: toastId });
        setVerifyOtp({...verifyOtp, sent: true})
      } else {
        toast.error(`Something went wrong!`, { id: toastId });
      }
    } catch (error) {
      console.error("Error:", error); // Debugging
      toast.error(error.response?.data?.message || "An error occurred", { id: toastId });
    }
  };

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    const email = watch('email')?.toLowerCase();
    const otp = watch('otp');

    const toastId = toast.loading(`Verifying OTP...`);
    try {
        const res = await axios.post('/api/auth/forgot-password/verify-otp', {email, otp})
        if(res.status === 200){
            toast.success('Verification successful', { id: toastId });
            setVerifyOtp({...verifyOtp, verify: true})
        } else {
            toast.error('Verification failed', { id: toastId });
        }
    } catch (error) {
        toast.error(error?.response?.data?.message, {id: toastId});
        console.log(error);
    }
  }

  const createNewPassword = async (e) => {
    e.preventDefault();
    const email = watch('email')?.toLowerCase();
    const password = watch('password');
    const errors = validatePassword(password);
    
    if(errors.length !== 0){
        setError(errors);
        return;
    }
    const toastId = toast.loading(`Changing password...`);
    try {
        const res = await axios.post('/api/auth/forgot-password/create-password', {email, password})
        if(res.status === 200){
            toast.success(`Password changed successfully!`, {id: toastId});
            setForgotPassword(false)
        }else{
            toast.success(`Something went wrong!`, {id: toastId});
        }
    } catch (error) {
        toast.error(error?.response?.data?.message, {id: toastId});
        console.log(error);
    }
  }

  return (
    <div className="flex flex-col gap-y-7 md:w-3/5 w-3/4 max-[500px]:w-full px-5 lg:px-0 items-center relative">
      <span
        className="absolute left-3 -top-[68px] cursor-pointer"
        onClick={() => {
            if(!verifyOtp.sent && !verifyOtp.verify) {
                setForgotPassword(false);
            }else{
                if (window.confirm("Are you sure you want to cancel?")) {
                setForgotPassword(false);
                }
            }
        }}
      >
        <MoveLeft />
      </span>
      <form className="flex flex-col gap-y-9 w-full text-[var(--withdarktext)]">
        {/* Email */}
        {
            (verifyOtp.sent && verifyOtp.verify) ? 
            <div className="flex flex-col gap-y-1 w-full">
              <div className="flex flex-col relative">
                <input
                  type={!show ? "password" : "text"}
                  id="password"
                  className="w-full border rounded-full outline-none px-5 py-2.5 pr-14 peer text-[var(--withdarkinnertext)]"
                  {...register("password")}
                  value={watch('password') || ''}
                />
                <label
                  htmlFor="password"
                  className={` absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                    watch("password") && `-translate-x-2 scale-90 -translate-y-8.5`
                  }`}
                >
                  Create a password
                </label>
                <span className="absolute right-5 top-1/2 -translate-y-1/2">
                  {show ? (
                    <Eye size={20} onClick={() => setShow(!show)} />
                  ) : (
                    <EyeClosed size={20} onClick={() => setShow(!show)} />
                  )}
                </span>
              </div>
              <p className={`pl-5 ${
                    error? `visible` : `invisible`
                  } pl-2 text-red-500 text-sm`}
                >
                  {error[0] === "" ? `Error` : error[0]}
                </p>
            </div>
            :
            <div className="flex flex-col gap-y-5">
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
            
            {
                verifyOtp.sent && 
                <div className="flex flex-col">
                  <div className="flex flex-col relative">
                    <input
                    type="number"
                    id="otp"
                    className="w-full border rounded-full outline-none px-5 py-2.5 peer text-[var(--withdarkinnertext)] lowercase"
                    {...register("otp")}
                    />
                    <label
                    htmlFor="otp"
                    className={`capitalize absolute top-1/2 -translate-y-1/2 left-5 peer-focus:-translate-y-8.5 peer-focus:scale-90 peer-focus:-translate-x-2 bg-[var(--ourbackground)] px-1 transition-all duration-200 ${
                        watch("otp") && `-translate-x-2 scale-90 -translate-y-8.5`
                    }`}
                    >
                    OTP
                    </label>
                  </div>
                  <div className="flex justify-end px-4">
                      <button type="button" className="text-sm cursor-pointer" onClick={sendOtp}>Resend OTP</button>
                  </div>
                </div>
                
            }
            </div>

        }
        

        <div className="flex justify-center">
          {!verifyOtp.sent ? 
            <button
            className="bg-[var(--secondary-color)] text-[var(--dark-btn)] rounded-full p-2 w-1/2 font-semibold cursor-pointer"
            onClick={sendOtp}
          >
            Send OTP
            </button>
            :
            verifyOtp.sent && !verifyOtp.verify ?
            <button 
                className="bg-[var(--secondary-color)] text-[var(--dark-btn)] rounded-full p-2 w-1/2 font-semibold cursor-pointer"
                onClick={verifyOtpHandler}
            >
                Verify OTP
            </button>
            :
            <button 
                className="bg-[var(--secondary-color)] text-[var(--dark-btn)] rounded-full p-2 w-1/2 font-semibold cursor-pointer"
                onClick={createNewPassword}
            >
                Create
            </button>
          }
        </div>
      </form>
    </div>
  );
}
