import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const cotizacion = await sql`SELECT * FROM cotizaciones WHERE id = ${id}` as Record<string, unknown>[]
    if (cotizacion.length === 0) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    const partidas = await sql`SELECT * FROM cotizacion_partidas WHERE cotizacion_id = ${id} ORDER BY created_at ASC`
    return NextResponse.json({ ...cotizacion[0], partidas })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const { estado } = await request.json()
    const result = await sql`UPDATE cotizaciones SET estado = ${estado} WHERE id = ${id} RETURNING *` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
