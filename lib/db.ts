import { neon } from '@neondatabase/serverless'

type NeonSql = ReturnType<typeof neon>

function getDbClient(): NeonSql {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      '[DB] DATABASE_URL no está configurada. Asegúrate de tener un archivo .env con la variable DATABASE_URL.'
    )
  }
  return neon(connectionString)
}

// Lazy initialization — only connects when actually used
let _sql: NeonSql | null = null

function getSql(): NeonSql {
  if (!_sql) {
    _sql = getDbClient() as NeonSql
  }
  return _sql
}

// Backward-compatible tagged-template export using a Proxy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql: NeonSql = new Proxy((() => { }) as any, {
  apply(_target: unknown, _thisArg: unknown, args: unknown[]) {
    const realSql = getSql()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (realSql as any)(...args)
  },
  get(_target: unknown, prop: string | symbol, receiver: unknown) {
    const realSql = getSql()
    const value = Reflect.get(realSql, prop, receiver)
    if (typeof value === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).bind(realSql)
    }
    return value
  },
}) as NeonSql
