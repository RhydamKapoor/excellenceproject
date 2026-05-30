"use client";

import { emailVerificationSchema } from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft, Eye, EyeClosed } from "lucide-react";
import { useEffect, useState } from "react";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

const STEP_HINTS = {
  email: "Enter your email and we'll send a verification code.",
  otp: "Enter the 6-digit code sent to your email.",
  password: "Create a strong new password for your account.",
};

export default function ForgotPassword({ setForgotPassword, onStepChange }) {
  const {
    register,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(emailVerificationSchema),
  });

  const [verifyOtp, setVerifyOtp] = useState({ sent: false, verify: false });
  const [show, setShow] = useBoolToggle();
  const [passwordErrors, setPasswordErrors] = useState([]);

  const step = verifyOtp.verify ? "password" : verifyOtp.sent ? "otp" : "email";
  const stepIndex = verifyOtp.verify ? 2 : verifyOtp.sent ? 1 : 0;
  const stepHint = STEP_HINTS[step];

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const validatePassword = (password) =>
    [
      password.length < 4 && "Password must be at least 4 characters",
      password.length > 20 && "Password must be less than 20 characters",
      !/[A-Z]/.test(password) && "Password must contain at least one uppercase letter",
      !/[a-z]/.test(password) && "Password must contain at least one lowercase letter",
      !/[!@#$%^&*(),.?":{}|<>]/.test(password) &&
        "Password must contain at least one special character",
      !/[0-9]/.test(password) && "Password must contain at least one numeric value",
      password.trim() === "" && "Enter the password",
    ].filter(Boolean);

  const handleBack = () => {
    if (!verifyOtp.sent && !verifyOtp.verify) {
      setForgotPassword(false);
      return;
    }
    if (window.confirm("Are you sure you want to cancel?")) {
      setForgotPassword(false);
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    const email = watch("email")?.toLowerCase();

    if (!isValidEmail(email)) {
      toast.error("Invalid email address");
      return;
    }

    const toastId = toast.loading("Sending OTP...");
    try {
      const res = await axios.post("/api/auth/forgot-password/send-otp", { email });
      if (res.status === 200) {
        toast.success("OTP sent successfully", { id: toastId });
        setVerifyOtp((prev) => ({ ...prev, sent: true }));
      } else {
        toast.error("Something went wrong!", { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred", { id: toastId });
    }
  };

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    const email = watch("email")?.toLowerCase();
    const otp = watch("otp");

    const toastId = toast.loading("Verifying OTP...");
    try {
      const res = await axios.post("/api/auth/forgot-password/verify-otp", { email, otp });
      if (res.status === 200) {
        toast.success("Verification successful", { id: toastId });
        setVerifyOtp((prev) => ({ ...prev, verify: true }));
      } else {
        toast.error("Verification failed", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verification failed", { id: toastId });
    }
  };

  const createNewPassword = async (e) => {
    e.preventDefault();
    const email = watch("email")?.toLowerCase();
    const password = watch("password");
    const validationErrors = validatePassword(password);

    if (validationErrors.length !== 0) {
      setPasswordErrors(validationErrors);
      return;
    }

    setPasswordErrors([]);
    const toastId = toast.loading("Changing password...");
    try {
      const res = await axios.post("/api/auth/forgot-password/create-password", {
        email,
        password,
      });
      if (res.status === 200) {
        toast.success("Password changed successfully!", { id: toastId });
        setForgotPassword(false);
      } else {
        toast.error("Something went wrong!", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred", { id: toastId });
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <button
        type="button"
        onClick={handleBack}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </button>

      <p className="text-sm text-muted-foreground">{stepHint}</p>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        {verifyOtp.verify ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              New password
            </label>
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
            {passwordErrors.length > 0 && (
              <p className="text-sm text-destructive">{passwordErrors[0]}</p>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="input-field lowercase"
                placeholder="you@company.com"
                disabled={verifyOtp.sent}
                {...register("email")}
              />
              {errors?.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {verifyOtp.sent && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="otp" className="text-sm font-medium text-foreground">
                    Verification code
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary transition-colors hover:underline"
                    onClick={sendOtp}
                  >
                    Resend code
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  id="otp"
                  className="input-field tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  {...register("otp")}
                />
              </div>
            )}
          </>
        )}

        {!verifyOtp.sent ? (
          <Button type="button" className="h-10 w-full rounded-2xl font-semibold" onClick={sendOtp}>
            Send verification code
          </Button>
        ) : verifyOtp.sent && !verifyOtp.verify ? (
          <Button
            type="button"
            className="h-10 w-full rounded-2xl font-semibold"
            onClick={verifyOtpHandler}
          >
            Verify code
          </Button>
        ) : (
          <Button
            type="button"
            className="h-10 w-full rounded-2xl font-semibold"
            onClick={createNewPassword}
          >
            Reset password
          </Button>
        )}
      </form>
    </div>
  );
}
