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
    const warehouseId = url.searchParams.get('warehouse')
    const search = url.searchParams.get('search')
    const lowStock = url.searchParams.get('low_stock')

    // Get warehouses
    const warehouses = await sql`SELECT w.*, b.name AS branch_name, u.full_name AS manager_name
      FROM warehouses w JOIN branches b ON w.branch_id = b.id LEFT JOIN users u ON w.manager_id = u.id
      WHERE w.org_id = ${orgId} AND w.active = true ORDER BY b.name`

    // Get items
    let itemQuery = `SELECT ii.*, w.name AS warehouse_name FROM inventory_items ii
      JOIN warehouses w ON ii.warehouse_id = w.id WHERE ii.org_id = $1`
    const params: unknown[] = [orgId]
    let idx = 2
    if (warehouseId) { itemQuery += ` AND ii.warehouse_id = $${idx}`; params.push(warehouseId); idx++ }
    if (search) { itemQuery += ` AND (ii.name ILIKE $${idx} OR ii.sku ILIKE $${idx})`; params.push(`%${search}%`); idx++ }
    if (lowStock === 'true') { itemQuery += ` AND ii.stock_qty <= ii.min_stock AND ii.min_stock > 0` }
    itemQuery += ` ORDER BY ii.name`
    const items = await sql.query(itemQuery, params)

    // Recent movements
    const movements = await sql`SELECT im.*, ii.name AS item_name, u.full_name AS performed_by_name,
        fw.name AS from_warehouse, tw.name AS to_warehouse
      FROM inventory_movements im
      JOIN inventory_items ii ON im.item_id = ii.id
      LEFT JOIN users u ON im.performed_by = u.id
      LEFT JOIN warehouses fw ON im.from_warehouse_id = fw.id
      LEFT JOIN warehouses tw ON im.to_warehouse_id = tw.id
      WHERE im.org_id = ${orgId} ORDER BY im.created_at DESC LIMIT 30`

    return NextResponse.json({ warehouses, items, movements })
  } catch (error) {
    console.error('[Almacenes API]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
