'use server';

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/profile" });
}

import prisma from "@/lib/prisma";

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const isWelcomeModal = formData.get("isWelcomeModal") === "true";
  const callbackUrl = formData.get("callbackUrl") as string || "/profile";
  
  if (!email) return { error: "Email is required" };

  try {
    if (isWelcomeModal) {
      // Server-driven architecture: aggressively grant the welcome coupon here.
      // NextAuth Prisma adapter operates on email. If it doesn't exist, we pre-create it.
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        await prisma.user.update({ where: { email }, data: { hasWelcomeCoupon: true } });
      } else {
        await prisma.user.create({ data: { email, hasWelcomeCoupon: true } });
      }
    }

    const res = await signIn("resend", { email, redirect: false, redirectTo: callbackUrl });
    if (res?.error) {
      return { error: `Auth Provider Error: ${res.error}` };
    }
    // Since redirect: false suppresses the automatic redirect, we check if it gives a URL
    if (res?.url) {
      return { url: res.url }; // Pass the redirect URL back to the client
    }
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
