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

    const employees = await sql`SELECT e.*, u.email, u.full_name, u.role, u.phone, u.avatar_url, b.name AS branch_name
      FROM employees e JOIN users u ON e.user_id = u.id LEFT JOIN branches b ON u.default_branch_id = b.id
      WHERE e.org_id = ${orgId} AND e.active = true ORDER BY u.full_name`

    const vacations = await sql`SELECT v.*, u.full_name AS employee_name, ap.full_name AS approved_by_name
      FROM hr_vacations v JOIN employees e ON v.employee_id = e.id JOIN users u ON e.user_id = u.id
      LEFT JOIN users ap ON v.approved_by = ap.id
      WHERE v.org_id = ${orgId} ORDER BY v.start_date DESC LIMIT 20`

    const incidents = await sql`SELECT hi.*, u.full_name AS employee_name, rep.full_name AS reported_by_name
      FROM hr_incidents hi JOIN employees e ON hi.employee_id = e.id JOIN users u ON e.user_id = u.id
      LEFT JOIN users rep ON hi.reported_by = rep.id
      WHERE hi.org_id = ${orgId} ORDER BY hi.date DESC LIMIT 20`

    const trainings = await sql`SELECT t.*, (SELECT COUNT(*) FROM hr_training_attendees ta WHERE ta.training_id = t.id) AS attendee_count
      FROM hr_trainings t WHERE t.org_id = ${orgId} ORDER BY t.date DESC LIMIT 10`

    const [stats] = await sql`SELECT
      (SELECT COUNT(*) FROM employees WHERE org_id = ${orgId} AND active = true) AS total_employees,
      (SELECT COUNT(*) FROM hr_vacations WHERE org_id = ${orgId} AND status = 'requested') AS pending_vacations,
      (SELECT COUNT(*) FROM hr_incidents WHERE org_id = ${orgId} AND date >= CURRENT_DATE - INTERVAL '30 days') AS recent_incidents
    ` as Record<string, unknown>[]

    return NextResponse.json({ employees, vacations, incidents, trainings, stats })
  } catch (error) { console.error('[RH API]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
