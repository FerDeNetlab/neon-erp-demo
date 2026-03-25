import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const users = await sql`SELECT org_id FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (!users.length) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const orgId = users[0].org_id
    const assets = await sql`SELECT a.*, b.name AS branch_name, u.full_name AS assigned_to_name
      FROM assets a LEFT JOIN branches b ON a.branch_id = b.id LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.org_id = ${orgId} ORDER BY a.name`
    const [stats] = await sql`SELECT COUNT(*) AS total, COALESCE(SUM(acquisition_cost),0) AS total_value,
      COUNT(*) FILTER (WHERE status = 'assigned') AS assigned FROM assets WHERE org_id = ${orgId}` as Record<string, unknown>[]
    return NextResponse.json({ assets, stats })
  } catch (error) { console.error('[Activos API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
