export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    //console.log("pais:", searchParams.get("pais"))

    const sql = await getPool()

    let candidates
    if (tipo) {
      // Filtrar por tipo de candidatura - solo candidatos activos
      candidates = await sql.query(`
        SELECT id, nombre, partido, tipo_candidatura, descripcion, pais, ranking, seguidores, foto_url, finalized
        FROM candidates 
        --WHERE tipo_candidatura = $1 AND activo = true AND finalized = false
        WHERE tipo_candidatura = $1 AND activo = true
        --ORDER BY ranking ASC, nombre ASC
        ORDER BY nombre ASC, ranking ASC
      `, [tipo])
    } else {
      // Obtener todos los candidatos activos
      candidates = await sql.query(`
        SELECT id, nombre, partido, tipo_candidatura, descripcion, pais, ranking, seguidores, foto_url, finalized
        FROM candidates 
        --WHERE activo = true AND finalized = false
        WHERE activo = true
        ORDER BY tipo_candidatura, nombre ASC, nombre ASC
        
      `)
    }

    return NextResponse.json({candidates: candidates.rows})
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
  }
}
