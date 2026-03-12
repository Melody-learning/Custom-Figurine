'use server';

import { signIn, signOut } from "@/auth";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/profile" });
}

export async function loginWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return;

  await signIn("nodemailer", { email, redirectTo: "/profile" });
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
