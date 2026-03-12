import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const vehiculo = await sql`SELECT v.*, u.nombre as conductor_nombre FROM vehiculos v LEFT JOIN usuarios u ON v.asignado_a = u.id WHERE v.id = ${id}` as Record<string, unknown>[]
    if (vehiculo.length === 0) return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })

    const mantenimientos = await sql`SELECT * FROM vehiculo_mantenimientos WHERE vehiculo_id = ${id} ORDER BY fecha DESC`
    const combustible = await sql`SELECT * FROM vehiculo_combustible WHERE vehiculo_id = ${id} ORDER BY fecha DESC`
    const multas = await sql`SELECT * FROM vehiculo_multas WHERE vehiculo_id = ${id} ORDER BY fecha DESC`

    return NextResponse.json({ ...vehiculo[0], mantenimientos, combustible, multas })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al obtener vehículo' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const body = await request.json()
    const { placa, marca, modelo, anio, color, tipo, estado, asignado_a, km_actual, notas } = body
    const result = await sql`
      UPDATE vehiculos SET
        placa = COALESCE(${placa}, placa), marca = COALESCE(${marca}, marca), modelo = COALESCE(${modelo}, modelo),
        anio = COALESCE(${anio}, anio), color = COALESCE(${color}, color), tipo = COALESCE(${tipo}, tipo),
        estado = COALESCE(${estado}, estado), asignado_a = ${asignado_a || null},
        km_actual = COALESCE(${km_actual}, km_actual), notas = COALESCE(${notas}, notas)
      WHERE id = ${id} RETURNING *
    ` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al actualizar vehículo' }, { status: 500 })
  }
}
