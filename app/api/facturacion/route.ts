import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')
  try {
    let facturas
    if (estado) {
      facturas = await sql`SELECT f.*, t.numero_ticket FROM facturas f LEFT JOIN tickets t ON f.ticket_id = t.id WHERE f.estado = ${estado} ORDER BY f.created_at DESC`
    } else {
      facturas = await sql`SELECT f.*, t.numero_ticket FROM facturas f LEFT JOIN tickets t ON f.ticket_id = t.id ORDER BY f.created_at DESC`
    }
    return NextResponse.json(facturas)
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { ticket_id, cotizacion_id, cliente_nombre, cliente_rfc, cliente_email, concepto, subtotal, iva, total, metodo_pago, fecha_vencimiento, notas } = await request.json()

    const countResult = await sql`SELECT COUNT(*)::int as count FROM facturas` as Record<string, unknown>[]
    const count = (countResult[0]?.count as number) || 0
    const numero_factura = `FAC-${String(count + 1).padStart(4, '0')}`

    const calcIva = iva ?? (subtotal ? Number(subtotal) * 0.16 : 0)
    const calcTotal = total ?? (subtotal ? Number(subtotal) + calcIva : 0)

    const result = await sql`
      INSERT INTO facturas (numero_factura, ticket_id, cotizacion_id, cliente_nombre, cliente_rfc, cliente_email, concepto, subtotal, iva, total, metodo_pago, fecha_vencimiento, notas, created_by)
      VALUES (${numero_factura}, ${ticket_id || null}, ${cotizacion_id || null}, ${cliente_nombre}, ${cliente_rfc || null}, ${cliente_email || null}, ${concepto || null}, ${subtotal || 0}, ${calcIva}, ${calcTotal}, ${metodo_pago || null}, ${fecha_vencimiento || null}, ${notas || null}, ${session.user.email})
      RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 })
  }
}
