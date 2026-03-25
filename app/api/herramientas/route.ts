import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const users = await sql`SELECT org_id FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (!users.length) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const orgId = users[0].org_id

    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')

    let query = `SELECT t.*, b.name AS branch_name,
        (SELECT json_build_object('id', tc.id, 'user_name', u.full_name, 'assigned_at', tc.assigned_at)
         FROM tool_custodies tc JOIN users u ON tc.user_id = u.id
         WHERE tc.tool_id = t.id AND tc.status = 'active' LIMIT 1) AS current_custody
      FROM tools t LEFT JOIN branches b ON t.branch_id = b.id
      WHERE t.org_id = $1`
    const params: unknown[] = [orgId]
    let idx = 2
    if (search) { query += ` AND (t.name ILIKE $${idx} OR t.serial_number ILIKE $${idx} OR t.brand ILIKE $${idx})`; params.push(`%${search}%`); idx++ }
    if (status) { query += ` AND t.status = $${idx}`; params.push(status); idx++ }
    query += ` ORDER BY t.name`
    const tools = await sql.query(query, params)

    // Stats
    const [stats] = await sql`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'available') AS available,
      COUNT(*) FILTER (WHERE status = 'assigned') AS assigned,
      COUNT(*) FILTER (WHERE status = 'in_maintenance') AS in_maintenance,
      COALESCE(SUM(acquisition_cost), 0) AS total_value
      FROM tools WHERE org_id = ${orgId}` as Record<string, unknown>[]

    // Active custodies
    const custodies = await sql`SELECT tc.*, t.name AS tool_name, t.serial_number, t.brand,
        u.full_name AS user_name, ab.full_name AS assigned_by_name
      FROM tool_custodies tc
      JOIN tools t ON tc.tool_id = t.id
      JOIN users u ON tc.user_id = u.id
      LEFT JOIN users ab ON tc.assigned_by = ab.id
      WHERE tc.org_id = ${orgId} AND tc.status = 'active'
      ORDER BY tc.assigned_at DESC`

    return NextResponse.json({ tools, stats, custodies })
  } catch (error) {
    console.error('[Herramientas API]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
