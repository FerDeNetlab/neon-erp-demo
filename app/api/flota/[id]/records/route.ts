import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

// Mantenimientos
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const subtype = searchParams.get('type') // 'mantenimiento', 'combustible', 'multa'

  try {
    const body = await request.json()

    if (subtype === 'combustible') {
      const { litros, costo_total, km_carga, gasolinera, fecha } = body
      const result = await sql`
        INSERT INTO vehiculo_combustible (vehiculo_id, conductor_id, litros, costo_total, km_carga, gasolinera, fecha)
        VALUES (${id}, ${null}, ${litros || null}, ${costo_total}, ${km_carga || null}, ${gasolinera || null}, ${fecha || new Date().toISOString().split('T')[0]})
        RETURNING *
      ` as Record<string, unknown>[]
      return NextResponse.json(result[0])
    }

    if (subtype === 'multa') {
      const { fecha, monto, motivo } = body
      const result = await sql`
        INSERT INTO vehiculo_multas (vehiculo_id, fecha, monto, motivo)
        VALUES (${id}, ${fecha}, ${monto || null}, ${motivo || null})
        RETURNING *
      ` as Record<string, unknown>[]
      return NextResponse.json(result[0])
    }

    // Default: mantenimiento
    const { tipo, descripcion, km_mantenimiento, costo, taller, fecha, proximo_mantenimiento_km, proximo_mantenimiento_fecha } = body
    const result = await sql`
      INSERT INTO vehiculo_mantenimientos (vehiculo_id, tipo, descripcion, km_mantenimiento, costo, taller, fecha, proximo_mantenimiento_km, proximo_mantenimiento_fecha)
      VALUES (${id}, ${tipo || 'preventivo'}, ${descripcion}, ${km_mantenimiento || null}, ${costo || null}, ${taller || null}, ${fecha}, ${proximo_mantenimiento_km || null}, ${proximo_mantenimiento_fecha || null})
      RETURNING *
    ` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }
}
