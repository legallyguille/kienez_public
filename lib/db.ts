// lib/db.ts
import "server-only"
import { Pool, PoolClient } from "pg"
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector"
import { GoogleAuth } from "google-auth-library"

let pool: Pool | null = null
let connector: Connector | null = null

const isVercel = !!process.env.VERCEL

function getIpType() {
  // Permite cambiar a privada si configuras una VPC: CLOUD_SQL_IP_TYPE=PRIVATE
  return (process.env.CLOUD_SQL_IP_TYPE || "PUBLIC").toUpperCase() === "PRIVATE"
    ? IpAddressTypes.PRIVATE
    : IpAddressTypes.PUBLIC
}

function getServiceAccountCreds(): Record<string, any> | undefined {
  if (process.env.GCP_SA_KEY) {
    return JSON.parse(process.env.GCP_SA_KEY)
  }
  if (process.env.GCP_SA_KEY_B64) {
    const json = Buffer.from(process.env.GCP_SA_KEY_B64, "base64").toString("utf8")
    return JSON.parse(json)
  }
  return undefined
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool

  const hasConnectorVars =
    !!process.env.INSTANCE_CONNECTION_NAME &&
    !!process.env.DB_USER &&
    !!process.env.DB_PASS &&
    !!process.env.DB_NAME &&
    (!!process.env.GCP_SA_KEY || !!process.env.GCP_SA_KEY_B64)

  // En Vercel exigimos Connector; evita caer a localhost por accidente
  if (isVercel && !hasConnectorVars) {
    throw new Error(
      "Faltan variables para Cloud SQL Connector en producción. Revisa INSTANCE_CONNECTION_NAME, DB_*, y GCP_SA_KEY (o GCP_SA_KEY_B64)."
    )
  }

  if (hasConnectorVars) {
    const creds = getServiceAccountCreds()
    const auth = new GoogleAuth({
      credentials: creds, // En local puedes omitir para usar ADC; en Vercel usa SA
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })

    connector = new Connector({ auth })

    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
      ipType: getIpType(),
    })
    // clientOpts trae lo necesario para pg (host, port, ssl)

    pool = new Pool({
      ...clientOpts,
      user: process.env.DB_USER!,
      password: process.env.DB_PASS!,
      database: process.env.DB_NAME!,
      max: parseInt(process.env.DB_POOL_MAX || "5", 10),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    })

    // Cierre ordenado
    const close = () => {
      if (connector) connector.close()
      if (pool) void pool.end()
    }
    process.on("beforeExit", close)
    process.on("SIGINT", () => {
      close()
      process.exit(0)
    })
    process.on("SIGTERM", () => {
      close()
      process.exit(0)
    })

    return pool
  }

  // Fallback SOLO en local (útil con .env.local)
  if (process.env.DATABASE_URL && !isVercel) { 
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || "5", 10),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      // Si tu DATABASE_URL usa sslmode=require, pg lo activa; si no, puedes forzarlo así:
      // ssl: { rejectUnauthorized: false },
    })
    return pool
  }

  throw new Error("No hay configuración de conexión válida (Connector en prod, o DATABASE_URL en local).")
}

// Utilidad opcional para usar cliente transaccional cuando lo necesites
export async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const p = await getPool()
  const client = await p.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}


//pgbouncer connection pooling service

// import { Pool } from "pg"

// let pool: Pool | null = null

// export function getPool() {
//   if (pool) return pool

//   const isProd = !!process.env.VERCEL

//   const config = isProd
//     ? {
//         host: process.env.PGBOUNCER_HOST,
//         port: parseInt(process.env.PGBOUNCER_PORT || "5432", 10),
//         user: process.env.DB_USER,
//         password: process.env.DB_PASS,
//         database: process.env.DB_NAME,
//         ssl: { rejectUnauthorized: false },
//         max: 5,
//       }
//     : {
//         connectionString: process.env.DATABASE_URL,
//         max: 5,
//       }

//   pool = new Pool(config)
//   return pool
// }



// import "server-only"
// import postgres from "postgres"

// // Verificar que estamos en el servidor y que la variable existe
// const databaseUrl = process.env.DATABASE_URL

// if (!databaseUrl) {
//   console.error(
//     "Available env vars:",
//     Object.keys(process.env).filter((key) => key.includes("DATABASE") || key.includes("POSTGRES")),
//   )
//   throw new Error("DATABASE_URL is not set in environment variables")
// }

// // Crear la conexión con configuración optimizada
// const sql = postgres(databaseUrl, {
//   // Configuración para evitar problemas de conexión
//   max: 10,
//   idle_timeout: 20,
//   connect_timeout: 10,
// })

// export { sql }
