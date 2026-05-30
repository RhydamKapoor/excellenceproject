import Signup from "../components/auth/Signup";
import AuthLayout from "../components/auth/AuthLayout";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Get started with your team workspace"
      illustrationSrc="/auth-illustration/signup-illustration.svg"
      illustrationAlt="Signup illustration"
      illustrationFirst={true}
    >
      <Signup />
    </AuthLayout>
  );
}
