import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Rogues",
  description: "Sign in to your Answer Engine Optimization platform",
};

/**
 * Login Page
 * Authentication page (uses (auth)/layout.tsx for split layout)
 */
export default function LoginPage() {
  return <LoginForm />;
}
