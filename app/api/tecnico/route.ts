import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    // Tickets assigned (demo: show all for demo purposes since we don't have user-ticket mapping)
    const ticketsPendientes = await sql`
      SELECT t.*, u.nombre as asignado_nombre 
      FROM tickets t 
      LEFT JOIN usuarios u ON t.asignado_a = u.id 
      WHERE t.estado IN ('pendiente', 'en_progreso') 
      ORDER BY 
        CASE t.prioridad WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END,
        t.fecha_programada ASC
      LIMIT 15`

    const ticketsHoy = await sql`
      SELECT t.*, u.nombre as asignado_nombre 
      FROM tickets t 
      LEFT JOIN usuarios u ON t.asignado_a = u.id 
      WHERE t.fecha_programada = CURRENT_DATE AND t.estado != 'cancelado'
      ORDER BY t.created_at ASC`

    const ticketsCompletadosHoy = await sql`
      SELECT COUNT(*)::int as count FROM tickets 
      WHERE estado = 'completado' AND DATE(updated_at) = CURRENT_DATE` as Record<string, unknown>[]

    const misEvidenciasRecientes = await sql`
      SELECT e.*, t.numero_ticket, t.titulo as ticket_titulo 
      FROM evidencias e 
      JOIN tickets t ON e.ticket_id = t.id 
      ORDER BY e.created_at DESC LIMIT 5`

    const misIncidenciasAbiertas = await sql`
      SELECT i.*, t.numero_ticket 
      FROM incidencias i 
      JOIN tickets t ON i.ticket_id = t.id 
      WHERE i.estado IN ('abierta', 'en_revision') 
      ORDER BY i.created_at DESC LIMIT 5`

    // Stats
    const totalPendientes = await sql`SELECT COUNT(*)::int as count FROM tickets WHERE estado = 'pendiente'` as Record<string, unknown>[]
    const totalEnProgreso = await sql`SELECT COUNT(*)::int as count FROM tickets WHERE estado = 'en_progreso'` as Record<string, unknown>[]
    const totalCompletados = await sql`SELECT COUNT(*)::int as count FROM tickets WHERE estado = 'completado'` as Record<string, unknown>[]

    return NextResponse.json({
      ticketsPendientes,
      ticketsHoy,
      completadosHoy: (ticketsCompletadosHoy[0]?.count as number) || 0,
      evidenciasRecientes: misEvidenciasRecientes,
      incidenciasAbiertas: misIncidenciasAbiertas,
      stats: {
        pendientes: (totalPendientes[0]?.count as number) || 0,
        enProgreso: (totalEnProgreso[0]?.count as number) || 0,
        completados: (totalCompletados[0]?.count as number) || 0,
      }
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
