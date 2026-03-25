import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const users = await sql`SELECT org_id, id, role, default_branch_id FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (!users.length) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const user = users[0]
    const orgId = user.org_id

    // Orders assigned to this tech
    const orders = await sql`SELECT so.*, b.name AS branch_name,
        COALESCE(json_agg(json_build_object('full_name', au.full_name, 'role', soa2.role))
          FILTER (WHERE soa2.user_id IS NOT NULL), '[]') AS team
      FROM service_orders so
      JOIN service_order_assignments soa ON so.id = soa.order_id AND soa.user_id = ${user.id}
      JOIN branches b ON so.branch_id = b.id
      LEFT JOIN service_order_assignments soa2 ON so.id = soa2.order_id
      LEFT JOIN users au ON soa2.user_id = au.id
      WHERE so.org_id = ${orgId} AND so.status NOT IN ('closed')
      GROUP BY so.id, b.name
      ORDER BY CASE so.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, so.scheduled_date NULLS LAST`

    // Tools assigned to this tech
    const tools = await sql`SELECT t.name, t.brand, t.serial_number, tc.assigned_at
      FROM tool_custodies tc JOIN tools t ON tc.tool_id = t.id
      WHERE tc.user_id = ${user.id} AND tc.status = 'active'`

    // Stats
    const [stats] = await sql`SELECT
      (SELECT COUNT(*) FROM service_order_assignments soa
        JOIN service_orders so ON soa.order_id = so.id
        WHERE soa.user_id = ${user.id} AND so.status = 'in_progress') AS in_progress,
      (SELECT COUNT(*) FROM service_order_assignments soa
        JOIN service_orders so ON soa.order_id = so.id
        WHERE soa.user_id = ${user.id} AND so.status = 'completed'
        AND so.completed_at >= CURRENT_DATE - INTERVAL '7 days') AS completed_week
    ` as Record<string, unknown>[]

    return NextResponse.json({ orders, tools, stats, user: { id: user.id, role: user.role } })
  } catch (error) { console.error('[Tecnico API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
