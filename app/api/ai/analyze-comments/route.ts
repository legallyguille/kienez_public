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
  // ideology: z.array(
  //   z.object({
  //     label: z.string().max(50),
  //     confidence: z.string().max(50),
  //     characteristic: z.array(z.string()).max(3),
  //     supportingEvidence: z.array(z.string()).max(3),
  //   }),
  // )
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

    // const pool = await getPool()

    // const {rows: previousRows} = await pool.query(
    //   `SELECT candidate_id, analysis_date, daily_sentiment, daily_content_count, daily_topic_distribution, daily_attribute_scores, daily_veracity_average, created_at
    //   FROM daily_analysis_metrics WHERE candidate_id = $1
    //   ORDER BY analysis_date DESC LIMIT 1`,
    //   [candidateId],
    // )

    // const previousMetrics = previousRows[0] || null

    // Generar análisis usando GPT-4o
    const { object: analysis } = await generateObject({
      //model: groq("mixtral-8x7b-32768"),
      model: openai("gpt-4o"),
      schema: AnalysisSchema,
      prompt: `
        Analiza el siguiente comentario político en español y proporciona:

        COMENTARIO: "${content}"

        Debes analizar:

        1. SENTIMIENTO (-1 a 1, donde -1 es muy negativo, 0 neutral, 1 muy positivo) toma en cuenta el número de reacciones de los usuarios que son confirmaciones: ${confirms}, si estan de acuerdo: ${agrees}, o si estan en desacuerdo: ${disagrees}
        2. TEMAS POLÍTICOS (0 a 1 para cada tema):
           - salud: ¿Habla sobre salud pública, hospitales, medicina, seguro social, seguridad social?
           - educacion: ¿Menciona escuelas, universidades, educación, formación docente, capacitación, formación técnica, formación profesional, INA, Fondo Especial para la Educación Superior (FEES), presupuesto para la educación?
           - economia: ¿Discute empleo, precios, economía, inflación, salarios, deuda pública, impuestos?
           - seguridad: ¿Habla de crimen, policía, seguridad, justicia, tribunales, cárceles, prisiones?
           - medio_ambiente: ¿Habla de ambiente, clima, contaminación, cambio climático, parques nacionales, reciclaje, conservación?
           - tecnologia: ¿Menciona tecnología, innovación, digitalización, internet, telecomunicaciones, avances tecnológicos?

        3. VERACIDAD (0-100): Probabilidad de que las afirmaciones sean verdaderas. Toma en cuenta si es hecho, opinión o rumor para ajustar tu veracidad estimada: es_hecho: ${es_hecho}, es_opinion: ${es_opinion}, es_rumor: ${es_rumor}. Además, si el comentario tiene muchas confirmaciones: ${confirms} y acuerdos: ${agrees}, aumenta la veracidad estimada, en relación a los desacuerdos ${disagrees}.
        4. ATRIBUTOS DEL CANDIDATO (0 a 1):
           - corrupto: ¿Sugiere corrupción?
           - transparente: ¿Sugiere transparencia?
           - experimentado: ¿Sugiere experiencia?
           - confiable: ¿Sugiere confiabilidad?
           - populista: ¿Sugiere populismo?

        5. CONFIANZA (0-1): Tu confianza en este análisis

        Responde solo con el JSON solicitado, sin explicaciones adicionales.
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

// async function updateCandidateProfile(candidateId: number) {
//   try {
//     const sql = await getPool()

//     // 1️⃣ — Obtener promedio de los posts analizados HOY
//     const { rows: todayStatsRows } = await sql.query(
//       `
//       SELECT 
//         AVG(sentiment_score) AS avg_sentiment,
//         COUNT(*) AS total_comments,
//         AVG(veracity_score) AS avg_veracity,
//         AVG((political_topics->>'salud')::float) AS avg_salud,
//         AVG((political_topics->>'educacion')::float) AS avg_educacion,
//         AVG((political_topics->>'economia')::float) AS avg_economia,
//         AVG((political_topics->>'seguridad')::float) AS avg_seguridad,
//         AVG((political_topics->>'medio_ambiente')::float) AS avg_ambiente,
//         AVG((attributes->>'corrupto')::float) AS avg_corrupto,
//         AVG((attributes->>'transparente')::float) AS avg_transparente,
//         AVG((attributes->>'experimentado')::float) AS avg_experimentado,
//         AVG((attributes->>'confiable')::float) AS avg_confiable,
//         AVG((attributes->>'populista')::float) AS avg_populista
//       FROM comment_analysis
//       WHERE candidate_id = $1
//       AND analysis_date = CURRENT_DATE
//       `,
//       [candidateId],
//     )

//     if (todayStatsRows.length === 0 || !todayStatsRows[0].avg_sentiment) {
//       console.log("No hay nuevos datos hoy para actualizar.")
//       return
//     }

//     const today = todayStatsRows[0]

//     // 2️⃣ — Obtener métricas acumuladas del día anterior
//     const { rows: previousRows } = await sql.query(
//       `
//       SELECT 
//         daily_sentiment,
//         daily_content_count,
//         daily_topic_distribution,
//         daily_attribute_scores,
//         daily_veracity_average
//       FROM daily_analysis_metrics
//       WHERE candidate_id = $1
//       ORDER BY analysis_date DESC
//       LIMIT 1
//       `,
//       [candidateId],
//     )

//     // 3️⃣ — Calcular nuevo promedio acumulativo
//     let accumulated = { ...today }
//     if (previousRows.length > 0) {
//       const prev = previousRows[0]
//       const prevCount = parseInt(prev.daily_content_count, 10) || 0
//       console.log("Métricas previas:", prev, "con conteo de:", prevCount)
//       const todayCount = parseInt(today.total_comments, 10) || 0
//       console.log("Métricas hoy:", today, "con conteo de:", todayCount)
//       const totalCount = prevCount + todayCount

//       const weightedAvg = (prevVal: number, todayVal: number) =>
//         (prevVal * prevCount + todayVal * todayCount) / totalCount

//       accumulated = {
//         avg_sentiment: weightedAvg(prev.daily_sentiment, today.avg_sentiment),
//         total_comments: totalCount,
//         avg_veracity: weightedAvg(prev.daily_veracity_average, today.avg_veracity),
//         avg_salud: weightedAvg(prev.daily_topic_distribution.salud, today.avg_salud),
//         avg_educacion: weightedAvg(prev.daily_topic_distribution.educacion, today.avg_educacion),
//         avg_economia: weightedAvg(prev.daily_topic_distribution.economia, today.avg_economia),
//         avg_seguridad: weightedAvg(prev.daily_topic_distribution.seguridad, today.avg_seguridad),
//         avg_ambiente: weightedAvg(prev.daily_topic_distribution.medio_ambiente, today.avg_ambiente),
//         avg_corrupto: weightedAvg(prev.daily_attribute_scores.corrupto, today.avg_corrupto),
//         avg_transparente: weightedAvg(prev.daily_attribute_scores.transparente, today.avg_transparente),
//         avg_experimentado: weightedAvg(prev.daily_attribute_scores.experimentado, today.avg_experimentado),
//         avg_confiable: weightedAvg(prev.daily_attribute_scores.confiable, today.avg_confiable),
//         avg_populista: weightedAvg(prev.daily_attribute_scores.populista, today.avg_populista),
//       }
//     }

//     // 4️⃣ — Guardar las métricas acumuladas (del día actual)
//     await sql.query(
//       `
//       INSERT INTO daily_analysis_metrics (
//         candidate_id, analysis_date,
//         daily_sentiment, daily_content_count, 
//         daily_veracity_average, 
//         daily_topic_distribution, daily_attribute_scores, 
//         created_at
//       ) VALUES (
//         $1, CURRENT_DATE,
//         $2, $3, 
//         $4,
//         $5, $6,
//         CURRENT_TIMESTAMP
//       )
//       ON CONFLICT (candidate_id, analysis_date)
//       DO UPDATE SET
//         daily_sentiment = EXCLUDED.daily_sentiment,
//         daily_content_count = EXCLUDED.daily_content_count,
//         daily_veracity_average = EXCLUDED.daily_veracity_average,
//         daily_topic_distribution = EXCLUDED.daily_topic_distribution,
//         daily_attribute_scores = EXCLUDED.daily_attribute_scores,
//         created_at = CURRENT_TIMESTAMP
//       `,
//       [
//         candidateId,
//         accumulated.avg_sentiment,
//         accumulated.total_comments,
//         accumulated.avg_veracity,
//         JSON.stringify({
//           salud: accumulated.avg_salud,
//           educacion: accumulated.avg_educacion,
//           economia: accumulated.avg_economia,
//           seguridad: accumulated.avg_seguridad,
//           medio_ambiente: accumulated.avg_ambiente,
//         }),
//         JSON.stringify({
//           corrupto: accumulated.avg_corrupto,
//           transparente: accumulated.avg_transparente,
//           experimentado: accumulated.avg_experimentado,
//           confiable: accumulated.avg_confiable,
//           populista: accumulated.avg_populista,
//         }),
//       ],
//     )

//     // 5️⃣ — Actualizar perfil global del candidato
//     await sql.query(
//       `
//       INSERT INTO candidate_ai_profiles (
//         candidate_id, overall_sentiment, total_comments, veracity_average,
//         topic_distribution, attribute_scores, last_updated
//       )
//       VALUES (
//         $1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP
//       )
//       ON CONFLICT (candidate_id)
//       DO UPDATE SET
//         overall_sentiment = $2,
//         total_comments = $3,
//         veracity_average = $4,
//         topic_distribution = $5,
//         attribute_scores = $6,
//         last_updated = CURRENT_TIMESTAMP
//       `,
//       [
//         candidateId,
//         accumulated.avg_sentiment,
//         accumulated.total_comments,
//         accumulated.avg_veracity,
//         JSON.stringify({
//           salud: accumulated.avg_salud,
//           educacion: accumulated.avg_educacion,
//           economia: accumulated.avg_economia,
//           seguridad: accumulated.avg_seguridad,
//           medio_ambiente: accumulated.avg_ambiente,
//         }),
//         JSON.stringify({
//           corrupto: accumulated.avg_corrupto,
//           transparente: accumulated.avg_transparente,
//           experimentado: accumulated.avg_experimentado,
//           confiable: accumulated.avg_confiable,
//           populista: accumulated.avg_populista,
//         }),
//       ],
//     )
//   } catch (error) {
//     console.error("Error actualizando perfil del candidato:", error)
//   }
// }

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