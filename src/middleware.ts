import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { auth: middleware } = NextAuth(authConfig)

export default middleware((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Protected routes
  const isProfileRoute = nextUrl.pathname.startsWith('/profile')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')

  if (isProfileRoute && !isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', nextUrl))
    }
    const role = (req.auth?.user as any)?.role
    if (role !== 'ADMIN') {
      return Response.redirect(new URL('/', nextUrl))
    }
  }
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
