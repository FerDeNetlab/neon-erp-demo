import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    const ticket = await sql`SELECT * FROM tickets WHERE id = ${id}` as Record<string, unknown>[]
    if (ticket.length === 0) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

    const evidencias = await sql`SELECT * FROM evidencias WHERE ticket_id = ${id} ORDER BY created_at DESC`
    const incidencias = await sql`SELECT * FROM incidencias WHERE ticket_id = ${id} ORDER BY created_at DESC`

    return NextResponse.json({ ...ticket[0], evidencias, incidencias })
  } catch (error) {
    console.error('[API] Error fetching ticket:', error)
    return NextResponse.json({ error: 'Error al obtener ticket' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    const body = await request.json()
    const { titulo, descripcion, tipo, estado, prioridad, cliente_nombre, cliente_telefono, direccion, ciudad, asignado_a, fecha_programada, fecha_inicio, fecha_fin, notas } = body

    const result = await sql`
      UPDATE tickets SET
        titulo = COALESCE(${titulo}, titulo),
        descripcion = COALESCE(${descripcion}, descripcion),
        tipo = COALESCE(${tipo}, tipo),
        estado = COALESCE(${estado}, estado),
        prioridad = COALESCE(${prioridad}, prioridad),
        cliente_nombre = COALESCE(${cliente_nombre}, cliente_nombre),
        cliente_telefono = COALESCE(${cliente_telefono}, cliente_telefono),
        direccion = COALESCE(${direccion}, direccion),
        ciudad = COALESCE(${ciudad}, ciudad),
        asignado_a = ${asignado_a || null},
        fecha_programada = ${fecha_programada || null},
        fecha_inicio = ${fecha_inicio || null},
        fecha_fin = ${fecha_fin || null},
        notas = COALESCE(${notas}, notas)
      WHERE id = ${id}
      RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error updating ticket:', error)
    return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    await sql`DELETE FROM tickets WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting ticket:', error)
    return NextResponse.json({ error: 'Error al eliminar ticket' }, { status: 500 })
  }
}
