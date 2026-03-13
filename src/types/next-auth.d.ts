import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role?: string
      /** The user's global coupon state for 10% off. */
      hasWelcomeCoupon?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    hasWelcomeCoupon?: boolean
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** The user's role. */
    role?: string
    /** The user's global coupon state for 10% off. */
    hasWelcomeCoupon?: boolean
  }
}
