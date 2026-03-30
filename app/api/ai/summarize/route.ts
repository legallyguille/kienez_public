export const runtime = "nodejs"
import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import { analyzeTrollFarmActivity } from "@/lib/analyzeTrollFarm"

const CrowdSummarySchema = z.object({
  overview: z.string().max(800),
  praise: z.array(z.string()).max(10),
  criticism: z.array(z.string()).max(10),
  repeatedQuestions: z.array(z.string()).max(10),
  sampleQuotes: z.array(z.string()).max(10),
  misinformationFlags: z
    .array(
      z.object({
        claim: z.string().max(200),
        note: z.string().max(160),
      }),
    )
    .max(10),
  ideology: z.array(
    z.object({
      label: z.string().max(50),
      confidence: z.string().max(50),
      characteristic: z.array(z.string()).max(3),
      supportingEvidence: z.array(z.string()).max(3),
    }),
  ),
})

export async function POST(req: NextRequest) {
  try {
    const { candidateId, comments, days, maxComments } = await req.json()
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId es requerido" }, { status: 400 })
    }

    const sql = await getPool()
    const today = new Date().toISOString().split("T")[0]

    const existingAnalysis = await sql.query(
      `SELECT summary_json FROM comment_summaries 
       WHERE candidate_id = $1 AND last_analysis_date = $2`,
      [candidateId, today],
    )

    if (existingAnalysis.rows.length > 0) {
      return NextResponse.json({
        success: true,
        summary: existingAnalysis.rows[0].summary_json,
        cached: true,
      })
    }

    // 1️⃣ Obtener resumen del día anterior
    const { rows: previousSummaryRows } = await sql.query(
      `
    SELECT summary_json, analysis_date
    FROM daily_summaries
    WHERE candidate_id = $1
    ORDER BY analysis_date DESC
    LIMIT 1
    `,
      [candidateId],
    )

    const previousSummary = previousSummaryRows[0]?.summary_json || null
    const previousDate = previousSummaryRows[0]?.analysis_date || null

    // 2️⃣ Preparar contexto del día anterior (si existe)
    const previousContext = previousSummary
      ? `
      ANÁLISIS DEL DÍA ANTERIOR (${previousDate}):
      - Resumen: ${previousSummary.overview}
      - Elogios previos: ${previousSummary.praise?.join("; ") || "N/A"}
      - Críticas previas: ${previousSummary.criticism?.join("; ") || "N/A"}
      - Ideología percibida: ${previousSummary.ideology?.map((i: any) => i.label).join(", ") || "Indeterminado"}
      - Temas persistentes o polémicos: ${previousSummary.repeatedQuestions?.join("; ") || "N/A"}
      - Banderas de desinformación: ${previousSummary.misinformationFlags?.map((f: any) => f.claim).join("; ") || "N/A"}
      
      Usa este contexto para comparar la conversación actual con la anterior y reflejar continuidad, evolución o cambios notables en la percepción pública.
    `
      : `
      No hay análisis previos. Haz el resumen de hoy normalmente sin contexto histórico.
    `

    // 3️⃣ (opcional) Contexto extendido de los últimos días
    const { rows: recentSummaries } = await sql.query(
      `
    SELECT summary_json
    FROM daily_summaries
    WHERE candidate_id = $1
    ORDER BY analysis_date DESC
    LIMIT 7
    `,
      [candidateId],
    )

    const condensedTrends =
      recentSummaries.length > 0
        ? `Tendencia de la última semana: ${recentSummaries
          .map((r) => r.summary_json.overview)
          .join(" | ")}`
        : ""


    const groupedByPost = new Map<number, {
      postContent: string
      label: "hecho" | "opinion" | "rumor"
      reactions: {
        confirms: number
        agrees: number
        disagrees: number
      }
      comments: string[]
    }>()

    console.log(`Procesando ${comments.length} comentarios para agrupar por post.`)
    for (const item of comments) {
      if (!groupedByPost.has(item.post_id)) {
        let label: "hecho" | "opinion" | "rumor" = "opinion"

        if (item.es_hecho) label = "hecho"
        else if (item.es_rumor) label = "rumor"
        else if (item.es_opinion) label = "opinion"

        groupedByPost.set(item.post_id, {
          postContent: item.post_content,
          label,
          reactions: {
            confirms: item.confirms || 0,
            agrees: item.agrees || 0,
            disagrees: item.disagrees || 0,
          },
          comments: [],
        })
      }

      if (item.content_type === "comment") {
        groupedByPost.get(item.post_id)!.comments.push(item.content)
      }
    }

    const discussionContext = Array.from(groupedByPost.values())
      .map((thread, index) => {
        return `
    HILO ${index + 1}:

    POST:
    "${thread.postContent}"

    CLASIFICACIÓN INICIAL: ${thread.label.toUpperCase()}

    REACCIONES SOCIALES:
    - Confirmo: ${thread.reactions.confirms}
    - Coincido: ${thread.reactions.agrees}
    - Desacuerdo: ${thread.reactions.disagrees}

    COMENTARIOS:
    ${thread.comments.length > 0 ? thread.comments.map((c) => `- ${c}`).join("\n") : "- (Sin comentarios)"}
    `
      })
      .join("\n\n---\n\n")



    // 4️⃣ Generar resumen acumulativo con GPT-4o
    const { object: summary } = await generateObject({
      model: openai("gpt-4o"),
      schema: CrowdSummarySchema,
      prompt: `
      Analista de conversaciones políticas
    `,
    })
      // ### Comentarios del día:
      // "${comments.map((c: any) => c.content).join(" || ")}"
    // 1️⃣ Obtener analisis troll del día anterior
    const { rows: previousTrollAnalysisRows } = await sql.query(
      `
        SELECT trollanalysis_json, analysis_date
        FROM daily_summaries
        WHERE candidate_id = $1
        ORDER BY analysis_date DESC
        LIMIT 1
      `,
      [candidateId],
    )

    const previousTrollAnalysis = previousTrollAnalysisRows[0]?.trollanalysis_json || null
    const previousTrollDate = previousTrollAnalysisRows[0]?.analysis_date || null
    // 2️⃣ Analizar actividad colectiva tipo "granja de trolls"
    const trollAnalysis = await analyzeTrollFarmActivity(comments, previousTrollAnalysis, previousTrollDate)

    console.log("Resumen generado:", JSON.stringify(summary))

    await sql.query(
      `INSERT INTO daily_summaries (candidate_id, analysis_date, summary_json, comments_analyzed, trollanalysis_json)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (candidate_id, analysis_date)
       DO UPDATE SET summary_json = EXCLUDED.summary_json, comments_analyzed = EXCLUDED.comments_analyzed, trollanalysis_json = EXCLUDED.trollanalysis_json`,
      [candidateId, today, JSON.stringify(summary), comments.length, JSON.stringify(trollAnalysis)],
    )

    // 5) Guardar y devolver
    await sql.query(
      `
      INSERT INTO comment_summaries (
        candidate_id, window_days, summary_json, last_analysis_date, created_at, trollanalysis_json
      ) VALUES ($1, $2, $3, $4, NOW(), $5)
      ON CONFLICT (candidate_id)
      DO UPDATE SET summary_json = EXCLUDED.summary_json, last_analysis_date = EXCLUDED.last_analysis_date, created_at = NOW(), trollanalysis_json = EXCLUDED.trollanalysis_json
      `,
      [candidateId, days, JSON.stringify(summary), today, JSON.stringify(trollAnalysis)],
    )

    return NextResponse.json({ success: true, summary, trollAnalysis })
  } catch (err) {
    console.error("Error generando resumen:", err)
    return NextResponse.json({ error: "No se pudo generar el resumen" }, { status: 500 })
  }
}
