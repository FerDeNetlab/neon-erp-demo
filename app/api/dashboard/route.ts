import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    // Tickets stats
    const ticketStats = await sql`
      SELECT estado, COUNT(*)::int as count FROM tickets GROUP BY estado`
    const ticketsByType = await sql`
      SELECT tipo, COUNT(*)::int as count FROM tickets GROUP BY tipo ORDER BY count DESC`
    const ticketsByPriority = await sql`
      SELECT prioridad, COUNT(*)::int as count FROM tickets GROUP BY prioridad`
    const ticketsByCity = await sql`
      SELECT ciudad, COUNT(*)::int as count FROM tickets WHERE ciudad IS NOT NULL GROUP BY ciudad ORDER BY count DESC LIMIT 5`

    // Incidencias
    const incidenciaStats = await sql`
      SELECT estado, COUNT(*)::int as count FROM incidencias GROUP BY estado`
    const incidenciasBySeverity = await sql`
      SELECT severidad, COUNT(*)::int as count FROM incidencias GROUP BY severidad`

    // Evidencias
    const totalEvidencias = await sql`SELECT COUNT(*)::int as count FROM evidencias` as Record<string, unknown>[]

    // Activos
    const activoStats = await sql`
      SELECT estado, COUNT(*)::int as count FROM activos_fijos GROUP BY estado`
    const activoTotal = await sql`
      SELECT COALESCE(SUM(valor_adquisicion), 0)::numeric as total FROM activos_fijos` as Record<string, unknown>[]

    // Materiales
    const materialesLowStock = await sql`
      SELECT nombre, stock_actual, stock_minimo FROM materiales WHERE stock_actual <= stock_minimo AND stock_minimo > 0`
    const totalMateriales = await sql`SELECT COUNT(*)::int as count FROM materiales` as Record<string, unknown>[]

    // Flota
    const vehiculoStats = await sql`
      SELECT estado, COUNT(*)::int as count FROM vehiculos GROUP BY estado`
    const totalCombustible = await sql`
      SELECT COALESCE(SUM(costo_total), 0)::numeric as total FROM vehiculo_combustible` as Record<string, unknown>[]
    const totalMantenimiento = await sql`
      SELECT COALESCE(SUM(costo), 0)::numeric as total FROM vehiculo_mantenimientos` as Record<string, unknown>[]
    const totalMultas = await sql`
      SELECT COALESCE(SUM(monto), 0)::numeric as total FROM vehiculo_multas` as Record<string, unknown>[]
    const multasPendientes = await sql`
      SELECT COUNT(*)::int as count FROM vehiculo_multas WHERE estado = 'pendiente'` as Record<string, unknown>[]

    // Ventas
    const cotizacionStats = await sql`
      SELECT estado, COUNT(*)::int as count FROM cotizaciones GROUP BY estado`
    const cotizacionesTotal = await sql`
      SELECT COALESCE(SUM(total), 0)::numeric as total FROM cotizaciones WHERE estado = 'aceptada'` as Record<string, unknown>[]

    // Facturación
    const facturaStats = await sql`
      SELECT estado, COUNT(*)::int as count FROM facturas GROUP BY estado`
    const facturaPendiente = await sql`
      SELECT COALESCE(SUM(total), 0)::numeric as total FROM facturas WHERE estado = 'pendiente'` as Record<string, unknown>[]
    const facturaCobrada = await sql`
      SELECT COALESCE(SUM(total), 0)::numeric as total FROM facturas WHERE estado = 'pagada'` as Record<string, unknown>[]

    // Monthly revenue (facturas pagadas por mes)
    const monthlyRevenue = await sql`
      SELECT TO_CHAR(fecha_pago, 'YYYY-MM') as mes, COALESCE(SUM(total), 0)::numeric as total
      FROM facturas WHERE estado = 'pagada' AND fecha_pago IS NOT NULL
      GROUP BY mes ORDER BY mes DESC LIMIT 6`

    // Recent activity
    const recentTickets = await sql`
      SELECT numero_ticket, titulo, estado, created_at FROM tickets ORDER BY created_at DESC LIMIT 5`

    // Usuarios activos
    const totalUsuarios = await sql`SELECT COUNT(*)::int as count FROM usuarios WHERE activo = true` as Record<string, unknown>[]

    return NextResponse.json({
      tickets: { byEstado: ticketStats, byType: ticketsByType, byPriority: ticketsByPriority, byCity: ticketsByCity },
      incidencias: { byEstado: incidenciaStats, bySeverity: incidenciasBySeverity },
      evidencias: { total: (totalEvidencias[0]?.count as number) || 0 },
      activos: { byEstado: activoStats, valorTotal: Number(activoTotal[0]?.total) || 0 },
      materiales: { total: (totalMateriales[0]?.count as number) || 0, lowStock: materialesLowStock },
      flota: {
        byEstado: vehiculoStats,
        gastoCombustible: Number(totalCombustible[0]?.total) || 0,
        gastoMantenimiento: Number(totalMantenimiento[0]?.total) || 0,
        gastoMultas: Number(totalMultas[0]?.total) || 0,
        multasPendientes: (multasPendientes[0]?.count as number) || 0,
      },
      ventas: { byEstado: cotizacionStats, totalAceptadas: Number(cotizacionesTotal[0]?.total) || 0 },
      facturacion: {
        byEstado: facturaStats,
        porCobrar: Number(facturaPendiente[0]?.total) || 0,
        cobrado: Number(facturaCobrada[0]?.total) || 0,
        monthlyRevenue,
      },
      recentTickets,
      totalUsuarios: (totalUsuarios[0]?.count as number) || 0,
    })
  } catch (error) {
    console.error('[API] Dashboard error:', error)
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 })
  }
}
