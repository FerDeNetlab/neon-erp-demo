import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

// Get current user info (org, role, branch)
export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const users = await sql`
      SELECT u.*, b.name AS branch_name, o.name AS org_name, o.slug AS org_slug
      FROM users u
      LEFT JOIN branches b ON u.default_branch_id = b.id
      LEFT JOIN organizations o ON u.org_id = o.id
      WHERE u.email = ${session.user.email}
    ` as Record<string, unknown>[]

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado en el sistema' }, { status: 404 })
    }

    const user = users[0]

    // Get available branches for the user
    const branches = await sql`
      SELECT id, name, city, is_main FROM branches
      WHERE org_id = ${user.org_id} AND active = true
      ORDER BY is_main DESC, name
    `

    return NextResponse.json({ user, branches })
  } catch (error) {
    console.error('[User API]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
