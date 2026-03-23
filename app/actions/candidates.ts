"use server"

import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

interface CandidateFormData {
  nombre: string
  partido: string
  tipoCandidatura: string
  descripcion?: string
  pais: string
}

export async function createCandidate(prevState: any, formData: FormData) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    // Extraer datos del formulario
    const candidateData: CandidateFormData = {
      nombre: formData.get("nombre") as string,
      partido: formData.get("partido") as string,
      tipoCandidatura: formData.get("tipo-candidatura") as string,
      descripcion: formData.get("descripcion") as string,
      pais: formData.get("pais") as string,
    }

    // Validaciones básicas
    if (!candidateData.nombre || !candidateData.partido || !candidateData.tipoCandidatura) {
      return {
        success: false,
        message: "Todos los campos obligatorios deben ser completados.",
      }
    }

    // Verificar si ya existe un candidato con el mismo nombre
    const sql = await getPool()
    const existingCandidateResult = await sql.query(
      "SELECT id FROM candidates WHERE nombre = $1",
      [candidateData.nombre]
    )
    const existingCandidate = existingCandidateResult.rows

    if (existingCandidate.length > 0) {
      return {
        success: false,
        message: "Ya existe un candidato con ese nombre.",
      }
    }

    // Obtener el siguiente ranking para el tipo de candidatura
    const rankingResult = await sql.query(
      "SELECT COALESCE(MAX(ranking), 0) + 1 as next_ranking FROM candidates WHERE tipo_candidatura = $1 AND activo = true",
      [candidateData.tipoCandidatura]
    )
    const nextRanking = rankingResult.rows[0].next_ranking

    // Insertar el nuevo candidato
    const result = await sql.query(
      "INSERT INTO candidates (nombre, partido, tipo_candidatura, descripcion, pais, ranking) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, partido, tipo_candidatura, pais",
      [
        candidateData.nombre,
        candidateData.partido,
        candidateData.tipoCandidatura,
        candidateData.descripcion || "",
        candidateData.pais,
        nextRanking
      ]
    )

    return {
      success: true,
      message: "Candidato creado exitosamente.",
    }
  } catch (error) {
    console.error("Error al crear candidato:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

export async function updateCandidate(candidateId: number, prevState: any, formData: FormData) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    // Extraer datos del formulario
    const candidateData: CandidateFormData = {
      nombre: formData.get("nombre") as string,
      partido: formData.get("partido") as string,
      tipoCandidatura: formData.get("tipo-candidatura") as string,
      descripcion: formData.get("descripcion") as string,
      pais: formData.get("pais") as string,
    }

    // Validaciones básicas
    if (!candidateData.nombre || !candidateData.partido || !candidateData.tipoCandidatura) {
      return {
        success: false,
        message: "Todos los campos obligatorios deben ser completados.",
      }
    }

    // Verificar si ya existe otro candidato con el mismo nombre
    const sql = await getPool()
    const existingCandidateResult = await sql.query(
      "SELECT id FROM candidates WHERE nombre = $1 AND id != $2",
      [candidateData.nombre, candidateId]
    )
    const existingCandidate = existingCandidateResult.rows

    if (existingCandidate.length > 0) {
      return {
        success: false,
        message: "Ya existe otro candidato con ese nombre.",
      }
    }

    // Actualizar el candidato
    const result = await sql.query(
      `UPDATE candidates SET
        nombre = $1,
        partido = $2,
        tipo_candidatura = $3,
        descripcion = $4,
        pais = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, nombre, partido, tipo_candidatura`,
      [
        candidateData.nombre,
        candidateData.partido,
        candidateData.tipoCandidatura,
        candidateData.descripcion || "",
        candidateData.pais,
        candidateId
      ]
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Candidato no encontrado.",
      }
    }

    //console.log("Candidato actualizado exitosamente:", result.rows[0])

    return {
      success: true,
      message: "Candidato actualizado exitosamente.",
    }
  } catch (error) {
    console.error("Error al actualizar candidato:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

export async function deleteCandidate(candidateId: number) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    // Marcar el candidato como inactivo en lugar de eliminarlo
    const sql = await getPool()
    const result = await sql.query(
      `UPDATE candidates SET
        activo = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, nombre`,
      [candidateId]
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Candidato no encontrado.",
      }
    }

    //console.log("Candidato desactivado exitosamente:", result.rows[0])

    return {
      success: true,
      message: "Candidato eliminado exitosamente.",
    }
  } catch (error) {
    console.error("Error al eliminar candidato:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}
