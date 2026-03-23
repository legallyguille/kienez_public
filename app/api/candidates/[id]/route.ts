export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const sql = await getPool()
    const candidateId = Number.parseInt(params.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 })
    }

    const candidates = await sql.query(`
      SELECT id, nombre, partido, tipo_candidatura, descripcion, pais, ranking, seguidores, foto_url, activo
      FROM candidates 
      WHERE id = $1
    `, [candidateId])

    if (candidates.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    return NextResponse.json(candidates.rows[0])
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const candidateId = Number.parseInt(params.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 })
    }

    // Verificar que el candidato existe y está activo
    const sql = await getPool()
    const existingCandidate = await sql.query(`
      SELECT id, nombre, activo FROM candidates WHERE id = $1
    `, [candidateId])

    if (existingCandidate.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    if (!existingCandidate.rows[0].activo) {
      return NextResponse.json({ error: "Candidate already deleted" }, { status: 400 })
    }

    // Marcar como inactivo en lugar de eliminar
    const result = await sql.query(`
      UPDATE candidates SET
        activo = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND activo = true
      RETURNING id, nombre
    `, [candidateId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Candidate deleted successfully",
      candidate: result.rows[0],
    })
  } catch (error) {
    console.error("Error deleting candidate:", error)
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const candidateId = Number.parseInt(params.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate ID" }, { status: 400 })
    }

    const sql = await getPool()

    const finalizedCandidate = await sql.query(`
      SELECT id, nombre, finalized FROM candidates WHERE id = $1
    `, [candidateId])

    if(finalizedCandidate.rows.length === 0) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }
    
    let result;

    if(finalizedCandidate.rows[0].finalized == true) {
      result = await sql.query(`
        UPDATE candidates SET
          finalized = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND finalized = true
        RETURNING id, nombre
      `, [candidateId])
    }else{
      result = await sql.query(`
        UPDATE candidates SET
          finalized = true,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND finalized = false
        RETURNING id, nombre
      `, [candidateId])
    }

    // const result = await sql.query(`
    //   UPDATE candidates SET
    //     finalized = true,
    //     updated_at = CURRENT_TIMESTAMP
    //   WHERE id = $1 AND finalized = false
    //   RETURNING id, nombre
    // `, [candidateId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Failed to finalize candidate" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Candidate finalized successfully",
      candidate: result.rows[0],
    })
  } catch (error) {
    console.error("Error finalizing candidate:", error)
    return NextResponse.json({ error: "Failed to finalize candidate" }, { status: 500 })
  }
}
