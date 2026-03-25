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

    const orders = await sql`SELECT po.*, b.name AS branch_name, u.full_name AS created_by_name,
        au.full_name AS approved_by_name,
        COALESCE(json_agg(json_build_object('id', poi.id, 'description', poi.description, 'quantity', poi.quantity,
          'unit', poi.unit, 'unit_price', poi.unit_price, 'total', poi.total, 'received_qty', poi.received_qty))
          FILTER (WHERE poi.id IS NOT NULL), '[]') AS items
      FROM purchase_orders po
      JOIN branches b ON po.branch_id = b.id
      LEFT JOIN users u ON po.created_by = u.id
      LEFT JOIN users au ON po.approved_by = au.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE po.org_id = ${orgId}
      GROUP BY po.id, b.name, u.full_name, au.full_name
      ORDER BY po.created_at DESC`

    const [stats] = await sql`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
      COUNT(*) FILTER (WHERE status = 'submitted') AS submitted,
      COUNT(*) FILTER (WHERE status = 'approved') AS approved,
      COALESCE(SUM(total) FILTER (WHERE status IN ('approved','received')), 0) AS approved_total
      FROM purchase_orders WHERE org_id = ${orgId}` as Record<string, unknown>[]

    return NextResponse.json({ orders, stats })
  } catch (error) { console.error('[Compras API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
