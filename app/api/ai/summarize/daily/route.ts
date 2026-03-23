export const runtime = "nodejs"
import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const DailySummarySchema = z.object({
  overview: z.string().max(400),
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
  keyTopics: z.array(z.string()).max(5),
  sentimentTrend: z.enum(["improving", "declining", "stable", "mixed"]),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const candidateId = searchParams.get("candidateId")
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId es requerido" }, { status: 400 })
    }

    const sql = await getPool()
    const result = await sql.query(`SELECT * FROM daily_summaries WHERE candidate_id = $1 AND analysis_date = $2`, [
      candidateId,
      date,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No se encontró resumen para esta fecha" }, { status: 404 })
    }

    return NextResponse.json({ success: true, summary: result.rows[0] })
  } catch (err) {
    console.error("Error obteniendo resumen diario:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json()
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId es requerido" }, { status: 400 })
    }

    const sql = await getPool()
    const today = new Date().toISOString().split("T")[0]

    // Check if already analyzed today
    const existingAnalysis = await sql.query(
      `SELECT * FROM daily_summaries WHERE candidate_id = $1 AND analysis_date = $2`,
      [candidateId, today],
    )

    if (existingAnalysis.rows.length > 0) {
      return NextResponse.json({
        success: true,
        summary: existingAnalysis.rows[0].summary_json,
        cached: true,
      })
    }

    // Get today's content only
    const todayContent = await sql.query(
      `SELECT p.content as post_content, c.content as comment_content, c.id as comment_id, p.id as post_id
       FROM posts p
       LEFT JOIN comments c ON p.id = c.post_id
       WHERE p.candidate_id = $1 
       AND (p.created_at::date = $2 OR c.created_at::date = $2)
       ORDER BY COALESCE(c.created_at, p.created_at) DESC`,
      [candidateId, today],
    )

    if (todayContent.rows.length === 0) {
      return NextResponse.json({
        success: true,
        summary: { overview: "No hay contenido nuevo para analizar hoy." },
        noContent: true,
      })
    }

    // Get historical context (last 3 days)
    const historicalSummaries = await sql.query(
      `SELECT summary_json FROM daily_summaries 
       WHERE candidate_id = $1 AND analysis_date >= $2 AND analysis_date < $3
       ORDER BY analysis_date DESC LIMIT 3`,
      [candidateId, new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], today],
    )

    const historicalContext =
      historicalSummaries.rows.length > 0
        ? `Contexto de días anteriores: ${historicalSummaries.rows.map((r) => r.summary_json.overview).join(" | ")}`
        : ""

    const contentToAnalyze = todayContent.rows.map((row) => row.comment_content || row.post_content).filter(Boolean)

    // Generate daily summary
    const { object: summary } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: DailySummarySchema,
      prompt: `
        Analiza el contenido político del día de hoy en español.
        Enfócate SOLO en el contenido de hoy, pero considera el contexto histórico para identificar tendencias.

        ${historicalContext}

        ### Contenido de hoy: "${contentToAnalyze.join(" || ")}"

        Instrucciones:
        - "overview": Resumen del día, 2-3 oraciones
        - "sentimentTrend": Compara con días anteriores si hay contexto histórico
        - "keyTopics": Temas principales del día
        - Mantén el resto de campos como en el esquema original
      `,
    })

    // Save daily summary
    await sql.query(
      `INSERT INTO daily_summaries (candidate_id, analysis_date, summary_json, comments_analyzed, posts_analyzed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (candidate_id, analysis_date)
       DO UPDATE SET summary_json = EXCLUDED.summary_json, comments_analyzed = EXCLUDED.comments_analyzed, posts_analyzed = EXCLUDED.posts_analyzed`,
      [
        candidateId,
        today,
        JSON.stringify(summary),
        todayContent.rows.filter((r) => r.comment_content).length,
        todayContent.rows.filter((r) => r.post_content).length,
      ],
    )

    return NextResponse.json({ success: true, summary })
  } catch (err) {
    console.error("Error generando resumen diario:", err)
    return NextResponse.json({ error: "No se pudo generar el resumen diario" }, { status: 500 })
  }
}