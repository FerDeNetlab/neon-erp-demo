import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  try {
    const { estado, fecha_pago } = await request.json()
    const result = await sql`
      UPDATE facturas SET
        estado = COALESCE(${estado}, estado),
        fecha_pago = COALESCE(${fecha_pago}, fecha_pago)
      WHERE id = ${id} RETURNING *
    ` as Record<string, unknown>[]
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
