// Middleware — protects all routes except auth pages and static assets
import { auth } from '@/lib/auth/server'

export default auth.middleware({
  loginUrl: '/login',
})

export const config = {
  matcher: [
    // Protect everything except login, API auth, demo-setup, static assets
    '/((?!login|api/auth|api/demo-setup|_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

