import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const materiales = await sql`SELECT * FROM materiales ORDER BY nombre ASC`
    return NextResponse.json(materiales)
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al obtener materiales' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, ubicacion } = await request.json()
    const result = await sql`
      INSERT INTO materiales (nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, ubicacion)
      VALUES (${nombre}, ${categoria || 'otro'}, ${unidad || 'pieza'}, ${stock_actual || 0}, ${stock_minimo || 0}, ${costo_unitario || null}, ${ubicacion || null})
      RETURNING *
    ` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al crear material' }, { status: 500 })
  }
}
