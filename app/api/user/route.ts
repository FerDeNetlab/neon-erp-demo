import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

// Get current user info (org, role, branch)
export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    let users = await sql`
      SELECT u.*, b.name AS branch_name, o.name AS org_name, o.slug AS org_slug
      FROM users u
      LEFT JOIN branches b ON u.default_branch_id = b.id
      LEFT JOIN organizations o ON u.org_id = o.id
      WHERE u.email = ${session.user.email}
    ` as Record<string, unknown>[]

    // Auto-create user if they authenticated via Neon Auth but aren't in our DB
    if (users.length === 0) {
      const orgs = await sql`SELECT id FROM organizations LIMIT 1` as Record<string, unknown>[]
      if (orgs.length > 0) {
        const orgId = orgs[0].id
        const branches = await sql`SELECT id FROM branches WHERE org_id = ${orgId} AND is_main = true LIMIT 1` as Record<string, unknown>[]
        const branchId = branches.length > 0 ? branches[0].id : null
        const displayName = session.user.name || session.user.email?.split('@')[0] || 'Usuario'

        await sql`INSERT INTO users (org_id, email, full_name, role, default_branch_id, active)
          VALUES (${orgId}, ${session.user.email}, ${displayName}, 'admin', ${branchId}, true)
          ON CONFLICT (email) DO NOTHING`

        // Re-fetch
        users = await sql`
          SELECT u.*, b.name AS branch_name, o.name AS org_name, o.slug AS org_slug
          FROM users u
          LEFT JOIN branches b ON u.default_branch_id = b.id
          LEFT JOIN organizations o ON u.org_id = o.id
          WHERE u.email = ${session.user.email}
        ` as Record<string, unknown>[]
      }

      if (users.length === 0) {
        return NextResponse.json({ error: 'No se pudo configurar el usuario' }, { status: 500 })
      }
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

