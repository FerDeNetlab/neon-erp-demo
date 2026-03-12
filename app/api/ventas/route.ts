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
    let cotizaciones
    if (estado) {
      cotizaciones = await sql`SELECT * FROM cotizaciones WHERE estado = ${estado} ORDER BY created_at DESC`
    } else {
      cotizaciones = await sql`SELECT * FROM cotizaciones ORDER BY created_at DESC`
    }
    return NextResponse.json(cotizaciones)
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { cliente_nombre, cliente_email, cliente_telefono, cliente_empresa, vigencia, notas, partidas } = await request.json()

    const countResult = await sql`SELECT COUNT(*)::int as count FROM cotizaciones` as Record<string, unknown>[]
    const count = (countResult[0]?.count as number) || 0
    const numero_cotizacion = `COT-${String(count + 1).padStart(4, '0')}`

    // Calculate totals from partidas
    const items = (partidas || []) as Array<{ descripcion: string; cantidad: number; unidad: string; precio_unitario: number }>
    const subtotal = items.reduce((s: number, p) => s + (p.cantidad * p.precio_unitario), 0)
    const iva = subtotal * 0.16
    const total = subtotal + iva

    const result = await sql`
      INSERT INTO cotizaciones (numero_cotizacion, cliente_nombre, cliente_email, cliente_telefono, cliente_empresa, subtotal, iva, total, vigencia, notas, created_by)
      VALUES (${numero_cotizacion}, ${cliente_nombre}, ${cliente_email || null}, ${cliente_telefono || null}, ${cliente_empresa || null}, ${subtotal}, ${iva}, ${total}, ${vigencia || null}, ${notas || null}, ${session.user.email})
      RETURNING *
    ` as Record<string, unknown>[]

    const cotizacion = result[0]

    // Insert partidas
    for (const p of items) {
      const lineTotal = p.cantidad * p.precio_unitario
      await sql`INSERT INTO cotizacion_partidas (cotizacion_id, descripcion, cantidad, unidad, precio_unitario, total)
        VALUES (${cotizacion.id as string}, ${p.descripcion}, ${p.cantidad}, ${p.unidad || 'servicio'}, ${p.precio_unitario}, ${lineTotal})`
    }

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
