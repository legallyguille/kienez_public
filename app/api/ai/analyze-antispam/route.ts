export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Schema para la respuesta del análisis antispam
const AntispamSchema = z.object({
  isSpam: z.boolean(),
  spamScore: z.number().min(0).max(1),
  reason: z.string().optional(),
  categories: z.array(z.enum(["spam", "repetitive", "offensive", "irrelevant", "misinformation", "troll_farm", "clean"])),
}) 

export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, candidateId, content, esHecho, esOpinion, esRumor } = await request.json()

    if (!content || !contentId || !contentType) {
      return NextResponse.json({ error: "content, contentId y contentType son requeridos" }, { status: 400 })
    }

    const sql = await getPool()

    // Verificar si ya fue moderado
    const existingModeration = await sql.query(
      `SELECT status, spam_score, rejection_reason 
       FROM content_moderation 
       WHERE content_id = $1 AND content_type = $2`,
      [contentId, contentType],
    )

    if (existingModeration.rows.length > 0) {
      return NextResponse.json({
        success: true,
        moderation: existingModeration.rows[0],
        cached: true,
      })
    }

    // Determinar tipo de publicación (para el contexto del análisis)
    let tipoContenido = "opinión ciudadana"
    if (esHecho) tipoContenido = "hecho verificable"
    if (esRumor) tipoContenido = "rumor o información no confirmada"

    const { object: analysis } = await generateObject({
      model: openai("gpt-4o"),
      schema: AntispamSchema,
      prompt: `
        Eres un analista anti spam
      `,
    })

    // Determinar estado basado en el análisis
    const status = analysis.isSpam ? "rejected" : "approved"
    const rejectionReason = analysis.isSpam ? analysis.reason : null

    // Guardar resultado de moderación
    await sql.query(
      `INSERT INTO content_moderation (
        content_id, content_type, candidate_id, status, 
        spam_score, rejection_reason, moderated_at, moderated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'ai_system')
      ON CONFLICT (content_id, content_type)
      DO UPDATE SET
        status = EXCLUDED.status,
        spam_score = EXCLUDED.spam_score,
        rejection_reason = EXCLUDED.rejection_reason,
        moderated_at = CURRENT_TIMESTAMP`,
      [contentId, contentType, candidateId, status, analysis.spamScore, rejectionReason],
    )

    return NextResponse.json({
      success: true,
      moderation: {
        status,
        spamScore: analysis.spamScore,
        categories: analysis.categories,
        reason: rejectionReason,
      },
      analysis,
    })
  } catch (error) {
    console.error("Error en análisis antispam:", error)
    return NextResponse.json(
      {
        error: "Error procesando análisis antispam",
      },
      { status: 500 },
    )
  }
}
