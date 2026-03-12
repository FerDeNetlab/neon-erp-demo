import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const activos = await sql`SELECT a.*, u.nombre as asignado_nombre FROM activos_fijos a LEFT JOIN usuarios u ON a.asignado_a = u.id ORDER BY a.created_at DESC`
    return NextResponse.json(activos)
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al obtener activos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const { nombre, categoria, numero_serie, valor_adquisicion, fecha_adquisicion, notas } = await request.json()
    const result = await sql`
      INSERT INTO activos_fijos (nombre, categoria, numero_serie, valor_adquisicion, fecha_adquisicion, notas)
      VALUES (${nombre}, ${categoria || 'herramienta'}, ${numero_serie || null}, ${valor_adquisicion || null}, ${fecha_adquisicion || null}, ${notas || null})
      RETURNING *
    ` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error al crear activo' }, { status: 500 })
  }
}
