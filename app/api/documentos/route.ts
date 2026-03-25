import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session } = await auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const users = await sql`SELECT org_id FROM users WHERE email = ${session.user.email}` as Record<string, unknown>[]
    if (!users.length) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
    const orgId = users[0].org_id

    const documents = await sql`SELECT d.*, u.full_name AS uploaded_by_name
      FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.org_id = ${orgId} ORDER BY d.updated_at DESC`

    return NextResponse.json({ documents })
  } catch (error) { console.error('[Documentos API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
