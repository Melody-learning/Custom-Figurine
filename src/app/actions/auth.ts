'use server';

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/profile" });
}

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required" };

  try {
    await signIn("resend", { email, redirectTo: "/profile" });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to send magic link. Please check environment configuration or server logs." };
    }
    throw error;
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
