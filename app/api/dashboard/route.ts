import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    // Get user's org
    const users = await sql`SELECT org_id, role, default_branch_id FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (users.length === 0) return NextResponse.json({ error: 'Usuario no configurado' }, { status: 403 })
    const user = users[0]
    const orgId = user.org_id as string

    // KPIs
    const [ordersStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('created','assigned','in_progress')) AS active_orders,
        COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '7 days') AS completed_week,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('completed','closed')) AS urgent
      FROM service_orders WHERE org_id = ${orgId}
    ` as Record<string, unknown>[]

    const [inventoryStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE stock_qty <= min_stock AND min_stock > 0) AS low_stock_items,
        COUNT(*) AS total_items
      FROM inventory_items WHERE org_id = ${orgId}
    ` as Record<string, unknown>[]

    const [vehicleStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active_vehicles,
        COUNT(*) FILTER (WHERE status = 'in_shop') AS in_shop,
        COUNT(*) FILTER (WHERE insurance_expiry <= CURRENT_DATE + INTERVAL '30 days') AS insurance_alert
      FROM vehicles WHERE org_id = ${orgId}
    ` as Record<string, unknown>[]

    const [toolStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'in_maintenance') AS in_maintenance,
        COUNT(*) FILTER (WHERE status = 'assigned') AS assigned,
        COUNT(*) AS total
      FROM tools WHERE org_id = ${orgId}
    ` as Record<string, unknown>[]

    const [incidentStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open_incidents,
        COUNT(*) FILTER (WHERE severity IN ('high','critical') AND status = 'open') AS critical
      FROM incidents WHERE org_id = ${orgId}
    ` as Record<string, unknown>[]

    const [employeeStats] = await sql`
      SELECT COUNT(*) AS total_employees
      FROM employees WHERE org_id = ${orgId} AND active = true
    ` as Record<string, unknown>[]

    const [expenseStats] = await sql`
      SELECT
        COALESCE(SUM(amount), 0) AS total_expenses_month
      FROM operational_expenses
      WHERE org_id = ${orgId} AND date >= date_trunc('month', CURRENT_DATE)
    ` as Record<string, unknown>[]

    // Orders by status
    const ordersByStatus = await sql`
      SELECT status, COUNT(*) AS count
      FROM service_orders WHERE org_id = ${orgId}
      GROUP BY status ORDER BY count DESC
    `

    // Orders by type
    const ordersByType = await sql`
      SELECT service_type, COUNT(*) AS count
      FROM service_orders WHERE org_id = ${orgId}
      GROUP BY service_type ORDER BY count DESC
    `

    // Orders by branch
    const ordersByBranch = await sql`
      SELECT b.name AS branch, COUNT(so.id) AS count
      FROM service_orders so JOIN branches b ON so.branch_id = b.id
      WHERE so.org_id = ${orgId}
      GROUP BY b.name ORDER BY count DESC
    `

    // Recent orders
    const recentOrders = await sql`
      SELECT so.order_number, so.title, so.status, so.priority, so.service_type,
             so.client_name, so.scheduled_date, so.created_at, b.name AS branch_name
      FROM service_orders so
      JOIN branches b ON so.branch_id = b.id
      WHERE so.org_id = ${orgId}
      ORDER BY so.created_at DESC LIMIT 10
    `

    // Recent incidents
    const recentIncidents = await sql`
      SELECT i.title, i.severity, i.status, i.type, i.created_at,
             u.full_name AS reported_by_name
      FROM incidents i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.org_id = ${orgId}
      ORDER BY i.created_at DESC LIMIT 5
    `

    // Fleet costs (last 3 months)
    const fleetCosts = await sql`
      SELECT
        COALESCE((SELECT SUM(total_cost) FROM vehicle_fuel_logs vfl
          JOIN vehicles v ON vfl.vehicle_id = v.id
          WHERE v.org_id = ${orgId} AND vfl.date >= CURRENT_DATE - INTERVAL '90 days'), 0) AS fuel_cost,
        COALESCE((SELECT SUM(cost) FROM vehicle_maintenances vm
          JOIN vehicles v ON vm.vehicle_id = v.id
          WHERE v.org_id = ${orgId} AND vm.date_performed >= CURRENT_DATE - INTERVAL '90 days'), 0) AS maint_cost,
        COALESCE((SELECT SUM(amount) FROM vehicle_fines vf
          JOIN vehicles v ON vf.vehicle_id = v.id
          WHERE v.org_id = ${orgId} AND vf.date >= CURRENT_DATE - INTERVAL '90 days'), 0) AS fines_cost
    ` as Record<string, unknown>[]

    // Revenue vs Cost (completed orders)
    const [revenueCosts] = await sql`
      SELECT
        COALESCE(SUM(quoted_amount), 0) AS total_revenue,
        COALESCE((SELECT SUM(amount) FROM service_order_costs soc
          JOIN service_orders so2 ON soc.order_id = so2.id
          WHERE so2.org_id = ${orgId}), 0) AS total_costs
      FROM service_orders
      WHERE org_id = ${orgId} AND status IN ('completed', 'closed')
    ` as Record<string, unknown>[]

    return NextResponse.json({
      user: { role: user.role, branch_id: user.default_branch_id },
      kpis: {
        active_orders: ordersStats.active_orders,
        completed_week: ordersStats.completed_week,
        in_progress: ordersStats.in_progress,
        urgent: ordersStats.urgent,
        low_stock: inventoryStats.low_stock_items,
        total_items: inventoryStats.total_items,
        active_vehicles: vehicleStats.active_vehicles,
        vehicles_in_shop: vehicleStats.in_shop,
        insurance_alerts: vehicleStats.insurance_alert,
        tools_maintenance: toolStats.in_maintenance,
        tools_assigned: toolStats.assigned,
        tools_total: toolStats.total,
        open_incidents: incidentStats.open_incidents,
        critical_incidents: incidentStats.critical,
        total_employees: employeeStats.total_employees,
        expenses_month: expenseStats.total_expenses_month,
        total_revenue: revenueCosts.total_revenue,
        total_costs: revenueCosts.total_costs,
      },
      charts: { ordersByStatus, ordersByType, ordersByBranch },
      fleet: fleetCosts[0],
      recentOrders,
      recentIncidents,
    })
  } catch (error) {
    console.error('[Dashboard API]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
