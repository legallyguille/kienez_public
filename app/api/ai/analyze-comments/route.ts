export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Schema para la respuesta del análisis de IA
const AnalysisSchema = z.object({
  sentiment: z.object({
    score: z.number().min(-1).max(1),
    label: z.enum(["positive", "negative", "neutral"]),
  }),
  topics: z.object({
    salud: z.number().min(0).max(1),
    educacion: z.number().min(0).max(1),
    economia: z.number().min(0).max(1),
    seguridad: z.number().min(0).max(1),
    medio_ambiente: z.number().min(0).max(1),
    tecnologia: z.number().min(0).max(1),
  }),
  veracity: z.number().min(0).max(100),
  attributes: z.object({
    corrupto: z.number().min(0).max(1),
    transparente: z.number().min(0).max(1),
    experimentado: z.number().min(0).max(1),
    confiable: z.number().min(0).max(1),
    populista: z.number().min(0).max(1),
  }),
  confidence: z.number().min(0).max(1),
})

const CrowdSummarySchema = z.object({
  overview: z.string().max(400),
  topTopics: z
    .array(
      z.object({
        key: z.enum(["salud", "educacion", "economia", "seguridad", "corrupcion", "medio_ambiente", "tecnologia"]),
        share: z.number().min(0).max(1),
      }),
    )
    .max(3),
  topAttributes: z
    .array(
      z.object({
        key: z.enum(["corrupto", "transparente", "experimentado", "confiable", "populista"]),
        share: z.number().min(0).max(1),
      }),
    )
    .max(3),
  praise: z.array(z.string()).max(3),
  criticism: z.array(z.string()).max(3),
  repeatedQuestions: z.array(z.string()).max(3),
  sampleQuotes: z.array(z.string()).max(3),
  misinformationFlags: z
    .array(
      z.object({
        claim: z.string().max(200),
        note: z.string().max(160),
      }),
    )
    .max(3),
})

export async function POST(request: NextRequest) {
  try {
    const {
      commentId,
      postId,
      candidateId,
      content,
      confirms,
      agrees,
      disagrees,
      es_hecho,
      es_opinion,
      es_rumor,
      contentType,
    } = await request.json()

    if (!content || !postId) {
      return NextResponse.json({ error: "Content and postId are required" }, { status: 400 })
    }
    
    // Generar análisis usando GPT-4o
    const { object: analysis } = await generateObject({
      //model: groq("mixtral-8x7b-32768"),
      model: openai("gpt-4o"),
      schema: AnalysisSchema,
      prompt: `
        Eres un analista de sentimiento de comentarios
      `,
    })

    const sql = await getPool()
    await sql.query(
      `
      INSERT INTO comment_analysis (
        candidate_id, sentiment_score, sentiment_label,
        political_topics, veracity_score, attributes, confidence_score, 
        content_type, post_id, analysis_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE
      )
    `,
      [
        candidateId,
        analysis.sentiment.score,
        analysis.sentiment.label,
        JSON.stringify(analysis.topics),
        analysis.veracity,
        JSON.stringify(analysis.attributes),
        analysis.confidence,
        contentType,
        postId,
      ],
    )

    // Actualizar perfil agregado del candidato
    await updateCandidateProfile(candidateId)

    return NextResponse.json({
      success: true,
      analysis,
      message: "Análisis completado exitosamente",
    })
  } catch (error) {
    console.error("Error en análisis de IA:", error)
    return NextResponse.json(
      {
        error: "Error procesando análisis de IA",
      },
      { status: 500 },
    )
  }
}

async function updateCandidateProfile(candidateId: number) {
  try {
    const sql = await getPool()

    // Get overall statistics (all-time)
    const stats = await sql.query(
      `
      SELECT 
        AVG(sentiment_score) as avg_sentiment,
        COUNT(*) as total_comments,
        AVG(veracity_score) as avg_veracity,
        AVG((political_topics->>'salud')::float) as avg_salud,
        AVG((political_topics->>'educacion')::float) as avg_educacion,
        AVG((political_topics->>'economia')::float) as avg_economia,
        AVG((political_topics->>'seguridad')::float) as avg_seguridad,
        AVG((political_topics->>'medio_ambiente')::float) as avg_ambiente,
        AVG((political_topics->>'tecnologia')::float) as avg_tecnologia,
        AVG((attributes->>'corrupto')::float) as avg_corrupto,
        AVG((attributes->>'transparente')::float) as avg_transparente,
        AVG((attributes->>'experimentado')::float) as avg_experimentado,
        AVG((attributes->>'confiable')::float) as avg_confiable,
        AVG((attributes->>'populista')::float) as avg_populista
      FROM comment_analysis
      WHERE candidate_id = $1
    `,
      [candidateId],
    )

    if (stats.rows.length > 0) {
      const stat = stats.rows[0]

      // Update candidate profile with all-time aggregated data
      await sql.query(
        `
        INSERT INTO candidate_ai_profiles (
          candidate_id, overall_sentiment, total_comments, veracity_average,
          topic_distribution, attribute_scores, last_updated
        ) VALUES (
          $1,$2,$3,$4,$5,$6,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (candidate_id)
        DO UPDATE SET
          overall_sentiment = $2,
          total_comments = $3,
          veracity_average = $4,
          topic_distribution = $5,
          attribute_scores = $6,
          last_updated = CURRENT_TIMESTAMP
      `,
        [
          candidateId,
          stat.avg_sentiment,
          stat.total_comments,
          stat.avg_veracity,
          JSON.stringify({
            salud: stat.avg_salud || 0,
            educacion: stat.avg_educacion || 0,
            economia: stat.avg_economia || 0,
            seguridad: stat.avg_seguridad || 0,
            medio_ambiente: stat.avg_ambiente || 0,
            tecnologia: stat.avg_tecnologia || 0,
          }),
          JSON.stringify({
            corrupto: stat.avg_corrupto || 0,
            transparente: stat.avg_transparente || 0,
            experimentado: stat.avg_experimentado || 0,
            confiable: stat.avg_confiable || 0,
            populista: stat.avg_populista || 0,
          }),
        ],
      )
    }
  } catch (error) {
    console.error("Error actualizando perfil del candidato:", error)
  }
}
