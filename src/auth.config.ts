import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-compatible Auth config
// Do NOT import Nodemailer or PrismaAdapter here, as they contain Node-only dependencies
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "USER";
        token.id = user.id;
        token.hasWelcomeCoupon = (user as { hasWelcomeCoupon?: boolean }).hasWelcomeCoupon || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: unknown }).role = token.role;
        (session.user as { id?: unknown }).id = token.id;
        (session.user as { hasWelcomeCoupon?: unknown }).hasWelcomeCoupon = token.hasWelcomeCoupon;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify-request', // Overrides the default "check your email" page
  }
} satisfies NextAuthConfig;
