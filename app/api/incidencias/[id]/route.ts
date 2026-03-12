import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    const body = await request.json()
    const { estado, resolucion, severidad } = body

    const result = await sql`
      UPDATE incidencias SET
        estado = COALESCE(${estado}, estado),
        resolucion = COALESCE(${resolucion}, resolucion),
        severidad = COALESCE(${severidad}, severidad)
      WHERE id = ${id}
      RETURNING *
    ` as Record<string, unknown>[]

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error updating incidencia:', error)
    return NextResponse.json({ error: 'Error al actualizar incidencia' }, { status: 500 })
  }
}
