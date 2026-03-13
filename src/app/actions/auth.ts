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
      return { error: "AuthError: " + (error.cause?.err?.message || error.message) };
    }
    
    // Check if it's a Next.js redirect error (which uses NEXT_REDIRECT digest)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as { digest?: string }).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }

    // Capture and return any other server crashes (Prisma, Resend API key, etc.)
    return { error: error instanceof Error ? error.message : "A critical server error occurred." };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
