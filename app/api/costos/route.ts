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

    const expenses = await sql`SELECT oe.*, b.name AS branch_name, u.full_name AS recorded_by_name
      FROM operational_expenses oe
      LEFT JOIN branches b ON oe.branch_id = b.id LEFT JOIN users u ON oe.recorded_by = u.id
      WHERE oe.org_id = ${orgId} ORDER BY oe.date DESC`

    const orderCosts = await sql`SELECT soc.*, so.order_number, so.title AS order_title
      FROM service_order_costs soc JOIN service_orders so ON soc.order_id = so.id
      WHERE so.org_id = ${orgId} ORDER BY soc.created_at DESC LIMIT 50`

    const [summary] = await sql`SELECT
      COALESCE(SUM(amount) FILTER (WHERE date >= date_trunc('month', CURRENT_DATE)), 0) AS month_total,
      COALESCE(SUM(amount) FILTER (WHERE category = 'rent'), 0) AS rent,
      COALESCE(SUM(amount) FILTER (WHERE category = 'utilities'), 0) AS utilities,
      COALESCE(SUM(amount) FILTER (WHERE category = 'supplies'), 0) AS supplies,
      COALESCE(SUM(amount) FILTER (WHERE category = 'insurance'), 0) AS insurance,
      COALESCE(SUM(amount) FILTER (WHERE category = 'payroll'), 0) AS payroll,
      COALESCE(SUM(amount) FILTER (WHERE category = 'other'), 0) AS other_cat
      FROM operational_expenses WHERE org_id = ${orgId}` as Record<string, unknown>[]

    const [orderCostSummary] = await sql`SELECT
      COALESCE(SUM(amount) FILTER (WHERE cost_type = 'materials'), 0) AS materials,
      COALESCE(SUM(amount) FILTER (WHERE cost_type = 'labor'), 0) AS labor,
      COALESCE(SUM(amount) FILTER (WHERE cost_type = 'transport'), 0) AS transport,
      COALESCE(SUM(amount), 0) AS total
      FROM service_order_costs soc JOIN service_orders so ON soc.order_id = so.id WHERE so.org_id = ${orgId}` as Record<string, unknown>[]

    return NextResponse.json({ expenses, orderCosts, summary, orderCostSummary })
  } catch (error) { console.error('[Costos API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
