import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const vehiculos = await sql`SELECT v.*, u.nombre as conductor_nombre FROM vehiculos v LEFT JOIN usuarios u ON v.asignado_a = u.id ORDER BY v.created_at DESC`
    return NextResponse.json(vehiculos)
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { placa, marca, modelo, anio, color, tipo, numero_serie_vehicular, km_actual, notas } = await request.json()
    const result = await sql`
      INSERT INTO vehiculos (placa, marca, modelo, anio, color, tipo, numero_serie_vehicular, km_actual, notas)
      VALUES (${placa}, ${marca || null}, ${modelo || null}, ${anio || null}, ${color || null}, ${tipo || 'camioneta'}, ${numero_serie_vehicular || null}, ${km_actual || 0}, ${notas || null})
      RETURNING *
    ` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al crear vehículo' }, { status: 500 })
  }
}
