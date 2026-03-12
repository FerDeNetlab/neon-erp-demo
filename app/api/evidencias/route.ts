import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ticket_id = searchParams.get('ticket_id')

  try {
    let evidencias
    if (ticket_id) {
      evidencias = await sql`SELECT * FROM evidencias WHERE ticket_id = ${ticket_id} ORDER BY created_at DESC`
    } else {
      evidencias = await sql`SELECT e.*, t.numero_ticket, t.titulo as ticket_titulo FROM evidencias e LEFT JOIN tickets t ON e.ticket_id = t.id ORDER BY e.created_at DESC LIMIT 100`
    }
    return NextResponse.json(evidencias)
  } catch (error) {
    console.error('[API] Error fetching evidencias:', error)
    return NextResponse.json({ error: 'Error al obtener evidencias' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { ticket_id, tipo, url, descripcion } = body

    const result = await sql`
      INSERT INTO evidencias (ticket_id, tipo, url, descripcion, subido_por)
      VALUES (${ticket_id}, ${tipo || 'foto'}, ${url}, ${descripcion || null}, ${session.user.email})
      RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error creating evidencia:', error)
    return NextResponse.json({ error: 'Error al crear evidencia' }, { status: 500 })
  }
}
