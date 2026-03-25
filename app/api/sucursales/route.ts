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

    const branches = await sql`SELECT b.*, u.full_name AS manager_name,
        (SELECT COUNT(*) FROM users WHERE default_branch_id = b.id) AS user_count,
        (SELECT COUNT(*) FROM service_orders WHERE branch_id = b.id) AS order_count,
        (SELECT COUNT(*) FROM warehouses WHERE branch_id = b.id) AS warehouse_count,
        (SELECT COUNT(*) FROM vehicles WHERE branch_id = b.id) AS vehicle_count
      FROM branches b LEFT JOIN users u ON b.manager_id = u.id
      WHERE b.org_id = ${orgId} ORDER BY b.is_main DESC, b.name`

    const contracts = await sql`SELECT bc.*, b.name AS branch_name
      FROM branch_contracts bc JOIN branches b ON bc.branch_id = b.id
      WHERE bc.org_id = ${orgId} ORDER BY bc.end_date`

    return NextResponse.json({ branches, contracts })
  } catch (error) { console.error('[Sucursales API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
