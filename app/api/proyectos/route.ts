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

    const projects = await sql`SELECT p.*, u.full_name AS owner_name,
        (SELECT COUNT(*) FROM admin_tasks WHERE project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM admin_tasks WHERE project_id = p.id AND status = 'done') AS done_count
      FROM admin_projects p LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.org_id = ${orgId} ORDER BY p.created_at DESC`

    const tasks = await sql`SELECT t.*, p.name AS project_name, u.full_name AS assigned_to_name
      FROM admin_tasks t JOIN admin_projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE p.org_id = ${orgId} ORDER BY t.created_at DESC LIMIT 30`

    const meetings = await sql`SELECT m.*, u.full_name AS created_by_name, p.name AS project_name
      FROM meetings m LEFT JOIN users u ON m.created_by = u.id LEFT JOIN admin_projects p ON m.project_id = p.id
      WHERE m.org_id = ${orgId} ORDER BY m.date DESC LIMIT 10`

    return NextResponse.json({ projects, tasks, meetings })
  } catch (error) { console.error('[Proyectos API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
