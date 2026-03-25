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
    const status = url.searchParams.get('status')

    let query = `SELECT v.*, b.name AS branch_name, u.full_name AS assigned_to_name,
        (SELECT COUNT(*) FROM vehicle_maintenances vm WHERE vm.vehicle_id = v.id) AS maint_count,
        (SELECT SUM(total_cost) FROM vehicle_fuel_logs vfl WHERE vfl.vehicle_id = v.id) AS total_fuel_cost,
        (SELECT COUNT(*) FROM vehicle_fines vf WHERE vf.vehicle_id = v.id AND vf.status = 'pending') AS pending_fines
      FROM vehicles v
      LEFT JOIN branches b ON v.branch_id = b.id
      LEFT JOIN users u ON v.assigned_to = u.id
      WHERE v.org_id = $1`
    const params: unknown[] = [orgId]
    let idx = 2
    if (status) { query += ` AND v.status = $${idx}`; params.push(status); idx++ }
    query += ` ORDER BY v.economic_number`
    const vehicles = await sql.query(query, params)

    const [stats] = await sql`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'in_shop') AS in_shop,
      COUNT(*) FILTER (WHERE insurance_expiry <= CURRENT_DATE + INTERVAL '30 days') AS insurance_alert,
      COUNT(*) FILTER (WHERE verification_expiry <= CURRENT_DATE + INTERVAL '30 days') AS verification_alert
      FROM vehicles WHERE org_id = ${orgId}` as Record<string, unknown>[]

    return NextResponse.json({ vehicles, stats })
  } catch (error) {
    console.error('[Flotillas API]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
