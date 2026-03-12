import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get('estado')
  const tipo = searchParams.get('tipo')

  try {
    let tickets
    if (estado && tipo) {
      tickets = await sql`SELECT * FROM tickets WHERE estado = ${estado} AND tipo = ${tipo} ORDER BY created_at DESC`
    } else if (estado) {
      tickets = await sql`SELECT * FROM tickets WHERE estado = ${estado} ORDER BY created_at DESC`
    } else if (tipo) {
      tickets = await sql`SELECT * FROM tickets WHERE tipo = ${tipo} ORDER BY created_at DESC`
    } else {
      tickets = await sql`SELECT * FROM tickets ORDER BY created_at DESC`
    }
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('[API] Error fetching tickets:', error)
    return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { titulo, descripcion, tipo, prioridad, cliente_nombre, cliente_telefono, direccion, ciudad, asignado_a, fecha_programada, notas } = body

    // Generate ticket number
    const countResult = await sql`SELECT COUNT(*)::int as count FROM tickets` as Record<string, unknown>[]
    const count = (countResult[0]?.count as number) || 0
    const numero_ticket = `TK-${String(count + 1).padStart(4, '0')}`

    const result = await sql`
      INSERT INTO tickets (numero_ticket, titulo, descripcion, tipo, prioridad, cliente_nombre, cliente_telefono, direccion, ciudad, asignado_a, fecha_programada, notas, created_by)
      VALUES (${numero_ticket}, ${titulo}, ${descripcion || null}, ${tipo || 'otro'}, ${prioridad || 'media'}, ${cliente_nombre || null}, ${cliente_telefono || null}, ${direccion || null}, ${ciudad || null}, ${asignado_a || null}, ${fecha_programada || null}, ${notas || null}, ${session.user.email})
      RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error creating ticket:', error)
    return NextResponse.json({ error: 'Error al crear ticket' }, { status: 500 })
  }
}
