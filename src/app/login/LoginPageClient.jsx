"use client";

import { useState } from "react";
import Login from "../components/auth/Login";
import ForgotPassword from "../components/auth/ForgotPassword";
import AuthLayout from "../components/auth/AuthLayout";

const FORGOT_SUBTITLES = {
  email: "We'll email you a verification code",
  otp: "Check your inbox for the code",
  password: "Almost done — set your new password",
};

export default function LoginPageClient() {
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");

  return (
    <AuthLayout
      title={forgotPassword ? "Reset password" : "Welcome back"}
      subtitle={
        forgotPassword
          ? FORGOT_SUBTITLES[forgotStep]
          : "Sign in to continue to your workspace"
      }
      illustrationSrc="/auth-illustration/login-illustration.svg"
      illustrationAlt="Login illustration"
      illustrationFirst={false}
    >
      {forgotPassword ? (
        <ForgotPassword
          setForgotPassword={setForgotPassword}
          onStepChange={setForgotStep}
        />
      ) : (
        <Login onForgotPassword={() => setForgotPassword(true)} />
      )}
    </AuthLayout>
  );
}
