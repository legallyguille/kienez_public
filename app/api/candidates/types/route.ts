export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pais = searchParams.get("pais")

    const sql = await getPool()

    let types
    if (pais) { 
      // Obtener tipos de candidatura únicos de candidatos activos filtrados por país
      types = await sql.query(`
        SELECT DISTINCT tipo_candidatura
        FROM candidates 
        WHERE activo = true AND pais = $1
        ORDER BY tipo_candidatura ASC
      `, [pais])
    } else {
      // Obtener todos los tipos de candidatura únicos de candidatos activos
      types = await sql.query(`
        SELECT DISTINCT tipo_candidatura
        FROM candidates 
        WHERE activo = true
        ORDER BY tipo_candidatura ASC
      `)
    }
    
    // Formatear los tipos para mostrar nombres más amigables
    const formattedTypes = types.rows.map((type) => ({
      value: type.tipo_candidatura,
      label: formatCandidateType(type.tipo_candidatura),
    }))

    return NextResponse.json(formattedTypes)
  } catch (error) {
    console.error("Error fetching candidate types:", error)
    return NextResponse.json({ error: "Failed to fetch candidate types" }, { status: 500 })
  }
}

// Función para formatear los nombres de tipos de candidatura
function formatCandidateType(type: string): string {
  const typeMap: { [key: string]: string } = {
    presidente: "Candidatos Presidenciales",
    diputado: "Candidatos a Diputados",
    alcalde: "Candidatos a Alcalde",
    regidor: "Candidatos a Regidor",
    senador: "Candidatos a Senador",
    gobernador: "Candidatos a Gobernador",
    concejal: "Candidatos a Concejal",
    otro: "Otros Candidatos",
  }

  return typeMap[type.toLowerCase()] || `Candidatos a ${type.charAt(0).toUpperCase() + type.slice(1)}`
}
