// API handler for Neon Auth — proxies all auth requests
import { auth } from '@/lib/auth/server'

export const { GET, POST } = auth.handler()
