import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const users = await sql`SELECT org_id, role FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (!users.length || !['admin','manager'].includes(users[0].role as string)) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const orgId = users[0].org_id

    // ── Financial Overview ──
    const [financial] = await sql`SELECT
      (SELECT COALESCE(SUM(quoted_amount),0) FROM service_orders WHERE org_id = ${orgId} AND status IN ('completed','closed')) AS total_revenue,
      (SELECT COALESCE(SUM(quoted_amount),0) FROM service_orders WHERE org_id = ${orgId} AND status IN ('completed','closed') AND completed_at >= date_trunc('month', CURRENT_DATE)) AS month_revenue,
      (SELECT COALESCE(SUM(amount),0) FROM service_order_costs soc JOIN service_orders so ON soc.order_id = so.id WHERE so.org_id = ${orgId}) AS total_order_costs,
      (SELECT COALESCE(SUM(amount),0) FROM operational_expenses WHERE org_id = ${orgId}) AS total_opex,
      (SELECT COALESCE(SUM(amount),0) FROM operational_expenses WHERE org_id = ${orgId} AND date >= date_trunc('month', CURRENT_DATE)) AS month_opex,
      (SELECT COALESCE(SUM(total_cost),0) FROM vehicle_fuel_logs vfl JOIN vehicles v ON vfl.vehicle_id = v.id WHERE v.org_id = ${orgId}) AS total_fuel,
      (SELECT COALESCE(SUM(total),0) FROM purchase_orders WHERE org_id = ${orgId} AND status IN ('approved','received')) AS total_purchases
    ` as Record<string, unknown>[]

    // ── Per-Branch Performance ──
    const branchPerf = await sql`SELECT b.name,
        COUNT(so.id) AS orders,
        COUNT(so.id) FILTER (WHERE so.status = 'completed' OR so.status = 'closed') AS completed,
        COALESCE(SUM(so.quoted_amount) FILTER (WHERE so.status IN ('completed','closed')),0) AS revenue,
        (SELECT COUNT(*) FROM users WHERE default_branch_id = b.id) AS team_size,
        (SELECT COUNT(*) FROM vehicles WHERE branch_id = b.id AND status = 'active') AS vehicles
      FROM branches b LEFT JOIN service_orders so ON b.id = so.branch_id
      WHERE b.org_id = ${orgId} GROUP BY b.id, b.name ORDER BY revenue DESC`

    // ── Monthly Trend (last 6 months) ──
    const monthlyTrend = await sql`SELECT
        to_char(date_trunc('month', so.created_at), 'Mon') AS month,
        COUNT(*) AS orders,
        COALESCE(SUM(so.quoted_amount) FILTER (WHERE so.status IN ('completed','closed')),0) AS revenue
      FROM service_orders so WHERE so.org_id = ${orgId}
        AND so.created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY date_trunc('month', so.created_at)
      ORDER BY date_trunc('month', so.created_at)`

    // ── Service Type Distribution ──
    const typeDistribution = await sql`SELECT service_type,
        COUNT(*) AS count,
        COALESCE(SUM(quoted_amount),0) AS revenue
      FROM service_orders WHERE org_id = ${orgId} GROUP BY service_type ORDER BY count DESC`

    // ── Team Performance (top techs) ──
    const teamPerf = await sql`SELECT u.full_name,
        COUNT(soa.order_id) AS total_orders,
        COUNT(soa.order_id) FILTER (WHERE so.status IN ('completed','closed')) AS completed,
        COALESCE(AVG(EXTRACT(EPOCH FROM (so.completed_at - so.started_at))/3600) FILTER (WHERE so.completed_at IS NOT NULL AND so.started_at IS NOT NULL),0) AS avg_hours
      FROM service_order_assignments soa
      JOIN users u ON soa.user_id = u.id
      JOIN service_orders so ON soa.order_id = so.id
      WHERE so.org_id = ${orgId} AND u.role = 'installer'
      GROUP BY u.id, u.full_name ORDER BY completed DESC LIMIT 10`

    // ── Inventory Health ──
    const [inventoryHealth] = await sql`SELECT
      COUNT(*) AS total_items,
      COUNT(*) FILTER (WHERE stock_qty <= min_stock AND min_stock > 0) AS low_stock,
      COALESCE(SUM(stock_qty * unit_cost),0) AS inventory_value
      FROM inventory_items WHERE org_id = ${orgId}` as Record<string, unknown>[]

    // ── Fleet Health ──
    const [fleetHealth] = await sql`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'in_shop') AS in_shop,
      COUNT(*) FILTER (WHERE insurance_expiry <= CURRENT_DATE + INTERVAL '30 days') AS insurance_alert,
      COALESCE(SUM(current_km),0) AS total_km
      FROM vehicles WHERE org_id = ${orgId}` as Record<string, unknown>[]

    // ── HR Summary ──
    const [hrSummary] = await sql`SELECT
      (SELECT COUNT(*) FROM employees WHERE org_id = ${orgId} AND active = true) AS active_employees,
      (SELECT COUNT(*) FROM hr_vacations WHERE org_id = ${orgId} AND status = 'requested') AS pending_vac,
      (SELECT COUNT(*) FROM hr_incidents WHERE org_id = ${orgId} AND date >= CURRENT_DATE - INTERVAL '30 days') AS recent_incidents,
      (SELECT COUNT(*) FROM hr_trainings WHERE org_id = ${orgId} AND date >= CURRENT_DATE - INTERVAL '90 days') AS recent_trainings
    ` as Record<string, unknown>[]

    // ── Pending Actions ──
    const pendingActions = await sql`
      SELECT 'order' AS type, 'Órdenes sin asignar' AS title, COUNT(*) AS count FROM service_orders WHERE org_id = ${orgId} AND status = 'created'
      UNION ALL
      SELECT 'purchase', 'OC por aprobar', COUNT(*) FROM purchase_orders WHERE org_id = ${orgId} AND status = 'submitted'
      UNION ALL
      SELECT 'vacation', 'Vacaciones pendientes', COUNT(*) FROM hr_vacations WHERE org_id = ${orgId} AND status = 'requested'
      UNION ALL
      SELECT 'inventory', 'Productos bajo stock', COUNT(*) FROM inventory_items WHERE org_id = ${orgId} AND stock_qty <= min_stock AND min_stock > 0
      UNION ALL
      SELECT 'insurance', 'Vehículos por vencer seguro', COUNT(*) FROM vehicles WHERE org_id = ${orgId} AND insurance_expiry <= CURRENT_DATE + INTERVAL '30 days'
    `

    return NextResponse.json({
      financial, branchPerf, monthlyTrend, typeDistribution,
      teamPerf, inventoryHealth, fleetHealth, hrSummary, pendingActions
    })
  } catch (error) { console.error('[Directivo API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
