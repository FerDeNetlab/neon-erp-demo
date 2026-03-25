import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const users = await sql`SELECT org_id, role, default_branch_id FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (users.length === 0) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const { org_id: orgId } = users[0]

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const branch = url.searchParams.get('branch')
    const search = url.searchParams.get('search')

    let query = `
      SELECT so.*, b.name AS branch_name,
        COALESCE(json_agg(json_build_object('user_id', soa.user_id, 'full_name', u.full_name, 'role', soa.role))
          FILTER (WHERE soa.user_id IS NOT NULL), '[]') AS assignments
      FROM service_orders so
      JOIN branches b ON so.branch_id = b.id
      LEFT JOIN service_order_assignments soa ON so.id = soa.order_id
      LEFT JOIN users u ON soa.user_id = u.id
      WHERE so.org_id = $1
    `
    const params: unknown[] = [orgId]
    let paramIdx = 2

    if (status) { query += ` AND so.status = $${paramIdx}`; params.push(status); paramIdx++ }
    if (type) { query += ` AND so.service_type = $${paramIdx}`; params.push(type); paramIdx++ }
    if (branch) { query += ` AND so.branch_id = $${paramIdx}`; params.push(branch); paramIdx++ }
    if (search) { query += ` AND (so.title ILIKE $${paramIdx} OR so.order_number ILIKE $${paramIdx} OR so.client_name ILIKE $${paramIdx})`; params.push(`%${search}%`); paramIdx++ }

    query += ` GROUP BY so.id, b.name ORDER BY so.created_at DESC`

    const orders = await sql.query(query, params)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('[Orders API]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const users = await sql`SELECT id, org_id, role FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (users.length === 0) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const user = users[0]
    if (!['admin', 'manager', 'supervisor'].includes(user.role as string)) {
      return NextResponse.json({ error: 'Sin permisos para crear órdenes' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, service_type, priority, branch_id, client_name, client_phone, client_email, client_address, client_city, client_reference, scheduled_date, quoted_amount, assigned_installers, notes } = body

    // Generate order number
    const [count] = await sql`SELECT COUNT(*) AS c FROM service_orders WHERE org_id = ${user.org_id}` as Record<string, unknown>[]
    const orderNumber = 'OS-' + String(Number(count.c) + 1).padStart(4, '0')

    const [order] = await sql`
      INSERT INTO service_orders (org_id, branch_id, order_number, title, description, service_type, priority,
        client_name, client_phone, client_email, client_address, client_city, client_reference,
        scheduled_date, quoted_amount, notes, created_by)
      VALUES (${user.org_id}, ${branch_id}, ${orderNumber}, ${title}, ${description || null}, ${service_type || 'otro'},
        ${priority || 'medium'}, ${client_name || null}, ${client_phone || null}, ${client_email || null},
        ${client_address || null}, ${client_city || null}, ${client_reference || null},
        ${scheduled_date || null}, ${quoted_amount || 0}, ${notes || null}, ${user.id})
      RETURNING *
    ` as Record<string, unknown>[]

    // Assign installers if provided
    if (assigned_installers && Array.isArray(assigned_installers) && assigned_installers.length > 0) {
      for (let i = 0; i < assigned_installers.length; i++) {
        await sql`INSERT INTO service_order_assignments (order_id, user_id, role)
          VALUES (${order.id}, ${assigned_installers[i]}, ${i === 0 ? 'lead' : 'installer'})
          ON CONFLICT DO NOTHING`
      }
      await sql`UPDATE service_orders SET status = 'assigned' WHERE id = ${order.id}`
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('[Orders POST]', error)
    return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 })
  }
}
