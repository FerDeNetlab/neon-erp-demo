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
    let incidencias
    if (estado) {
      incidencias = await sql`SELECT i.*, t.numero_ticket, t.titulo as ticket_titulo FROM incidencias i LEFT JOIN tickets t ON i.ticket_id = t.id WHERE i.estado = ${estado} ORDER BY i.created_at DESC`
    } else {
      incidencias = await sql`SELECT i.*, t.numero_ticket, t.titulo as ticket_titulo FROM incidencias i LEFT JOIN tickets t ON i.ticket_id = t.id ORDER BY i.created_at DESC`
    }
    return NextResponse.json(incidencias)
  } catch (error) {
    console.error('[API] Error fetching incidencias:', error)
    return NextResponse.json({ error: 'Error al obtener incidencias' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { ticket_id, tipo, severidad, descripcion } = body

    const result = await sql`
      INSERT INTO incidencias (ticket_id, reportado_por, tipo, severidad, descripcion)
      VALUES (${ticket_id || null}, ${session.user.email}, ${tipo}, ${severidad || 'media'}, ${descripcion})
      RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error creating incidencia:', error)
    return NextResponse.json({ error: 'Error al crear incidencia' }, { status: 500 })
  }
}
