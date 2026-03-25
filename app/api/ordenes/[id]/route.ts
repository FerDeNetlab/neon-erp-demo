import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params

  try {
    const order = await sql`SELECT so.*, b.name AS branch_name
      FROM service_orders so JOIN branches b ON so.branch_id = b.id
      WHERE so.id = ${id}` as Record<string, unknown>[]
    if (order.length === 0) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    const assignments = await sql`
      SELECT soa.*, u.full_name, u.email, u.phone, u.role AS user_role
      FROM service_order_assignments soa JOIN users u ON soa.user_id = u.id
      WHERE soa.order_id = ${id}`
    const evidence = await sql`SELECT e.*, u.full_name AS uploaded_by_name
      FROM evidence e LEFT JOIN users u ON e.uploaded_by = u.id
      WHERE e.order_id = ${id} ORDER BY e.created_at DESC`
    const incidents = await sql`SELECT i.*, u.full_name AS reported_by_name
      FROM incidents i LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.order_id = ${id} ORDER BY i.created_at DESC`
    const materials = await sql`SELECT mc.*, ii.name AS item_name, ii.unit
      FROM material_consumptions mc JOIN inventory_items ii ON mc.item_id = ii.id
      WHERE mc.order_id = ${id} ORDER BY mc.created_at DESC`
    const costs = await sql`SELECT * FROM service_order_costs WHERE order_id = ${id} ORDER BY created_at DESC`

    return NextResponse.json({ ...order[0], assignments, evidence, incidents, materials, costs })
  } catch (error) {
    console.error('[Order GET]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params

  try {
    const body = await request.json()
    const { title, description, service_type, status, priority, branch_id, client_name, client_phone, client_email, client_address, client_city, client_reference, scheduled_date, quoted_amount, notes, assigned_vehicle_id } = body

    // Handle status transitions
    const extras: Record<string, unknown> = {}
    if (status === 'in_progress' && !body.started_at) extras.started_at = new Date().toISOString()
    if (status === 'completed' && !body.completed_at) extras.completed_at = new Date().toISOString()
    if (status === 'closed' && !body.closed_at) extras.closed_at = new Date().toISOString()

    const result = await sql`
      UPDATE service_orders SET
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description || null}, description),
        service_type = COALESCE(${service_type || null}, service_type),
        status = COALESCE(${status || null}, status),
        priority = COALESCE(${priority || null}, priority),
        branch_id = COALESCE(${branch_id || null}, branch_id),
        client_name = COALESCE(${client_name || null}, client_name),
        client_phone = COALESCE(${client_phone || null}, client_phone),
        client_email = COALESCE(${client_email || null}, client_email),
        client_address = COALESCE(${client_address || null}, client_address),
        client_city = COALESCE(${client_city || null}, client_city),
        client_reference = COALESCE(${client_reference || null}, client_reference),
        scheduled_date = ${scheduled_date || null},
        quoted_amount = COALESCE(${quoted_amount || null}, quoted_amount),
        notes = COALESCE(${notes || null}, notes),
        assigned_vehicle_id = ${assigned_vehicle_id || null},
        started_at = COALESCE(${(extras.started_at as string) || null}, started_at),
        completed_at = COALESCE(${(extras.completed_at as string) || null}, completed_at),
        closed_at = COALESCE(${(extras.closed_at as string) || null}, closed_at)
      WHERE id = ${id} RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[Order PUT]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params

  try {
    await sql`DELETE FROM service_orders WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Order DELETE]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
