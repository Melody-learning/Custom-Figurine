import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Override jwt callback here (Node Runtime) so we can use Prisma
  // auth.config.ts only handles role/id for Edge compatibility
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "USER";
        token.id = user.id;
      }
      // Always read latest coupon state from DB (handles post-revocation sync)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { hasWelcomeCoupon: true },
        });
        token.hasWelcomeCoupon = dbUser?.hasWelcomeCoupon ?? false;
      }
      return token;
    },
  },
  events: {
    // Grant welcome coupon to ALL new registrations (Google OAuth + Email Magic Link)
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { hasWelcomeCoupon: true },
        });
      }
    },
  },
  providers: [
    ...(authConfig.providers || []),
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          }),
        ]
      : []),
  ],
})
