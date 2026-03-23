export const runtime = 'nodejs'
// Importar `NextResponse` y `sql`
import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

// Modificar la función GET para incluir más logging
export async function GET() {
  try {
    //console.log("Attempting to connect to database and fetch users...")
    const sql = await getPool()
    const users = await sql.query(`SELECT id, name, email FROM users;`)
    //console.log("Successfully fetched users:", users)
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users from API route:", error)
    // Devolver un mensaje de error más detallado en desarrollo
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ error: "Failed to fetch users", details: (error as Error).message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
