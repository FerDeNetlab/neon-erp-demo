import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Check if demo user already exists in our users table
    const existing = await sql`SELECT id FROM users WHERE email = 'demo@frabe.mx'` as Record<string, unknown>[]
    if (existing.length) {
      return NextResponse.json({ message: 'Demo user already exists', email: 'demo@frabe.mx' })
    }

    // Get the org
    const [org] = await sql`SELECT id FROM organizations LIMIT 1` as Record<string, unknown>[]
    if (!org) return NextResponse.json({ error: 'No org found' }, { status: 500 })

    const [branch] = await sql`SELECT id FROM branches WHERE org_id = ${org.id} AND is_main = true LIMIT 1` as Record<string, unknown>[]

    // Insert demo user into our users table
    await sql`INSERT INTO users (org_id, email, full_name, role, default_branch_id, active)
      VALUES (${org.id}, 'demo@frabe.mx', 'Usuario Demo', 'admin', ${branch.id}, true)
      ON CONFLICT (email) DO NOTHING`

    return NextResponse.json({ message: 'Demo user created', email: 'demo@frabe.mx' })
  } catch (error) {
    console.error('[Demo Setup]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
