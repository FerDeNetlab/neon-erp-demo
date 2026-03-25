import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const users = await sql`SELECT org_id, role FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (!users.length || users[0].role !== 'admin') return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const orgId = users[0].org_id

    const allUsers = await sql`SELECT u.*, b.name AS branch_name, e.position, e.department, e.employee_number
      FROM users u LEFT JOIN branches b ON u.default_branch_id = b.id
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.org_id = ${orgId} ORDER BY u.full_name`

    return NextResponse.json({ users: allUsers })
  } catch (error) { console.error('[Usuarios API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
