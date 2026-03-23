export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { TrollFarmSchema } from "@/lib/analyzeTrollFarm"
//import { totalmem } from "os"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = await getPool()
    const resolvedParams = await params
    const candidateId = Number.parseInt(resolvedParams.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "ID de candidato inválido" }, { status: 400 })
    }

    // Obtener perfil de IA del candidato
    const profilesResult = await sql.query(
      `SELECT 
        cap.*,
        c.nombre as candidate_name,
        c.partido,
        c.tipo_candidatura
      FROM candidate_ai_profiles cap
      JOIN candidates c ON cap.candidate_id = c.id
      WHERE cap.candidate_id = $1`,
      [candidateId],
    )
    const profiles = profilesResult.rows

    if (profiles.length === 0) {
      return NextResponse.json(
        {
          error: "Perfil de IA no encontrado para este candidato",
        },
        { status: 404 },
      )
    }

    const profile = profiles[0]

    // Obtener análisis recientes para tendencias
    const recentAnalysis = await sql.query(
      `SELECT 
        DATE(analyzed_at) as date,
        AVG(sentiment_score) as avg_sentiment,
        COUNT(*) as comment_count
      FROM comment_analysis
      WHERE candidate_id = $1
        AND analyzed_at >= CURRENT_DATE - INTERVAL '240 days'
      GROUP BY DATE(analyzed_at)
      ORDER BY date DESC
      LIMIT 2000`,
      [candidateId],
    )

    const total_comments = await sql.query(
      `SELECT COUNT(*) as total
      FROM comments cm
      JOIN posts p ON cm.post_id_father = p.id
      WHERE p.candidate_id = $1`,
      [candidateId],
    )

    const total_posts = await sql.query(
      `SELECT COUNT(*) as total
      FROM posts p
      WHERE p.candidate_id = $1`,
      [candidateId],
    )

    const total = Number(total_comments.rows[0]?.total || 0) + Number(total_posts.rows[0]?.total || 0)

    // Obtener distribución de sentimientos
    const sentimentDistribution = await sql.query(
      `SELECT 
        sentiment_label,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM comment_analysis
      WHERE candidate_id = $1
      GROUP BY sentiment_label`,
      [candidateId],
    )

    // Obtener resumen de la multitud
    const crowdSummary = await sql.query(
      `SELECT summary_json, trollanalysis_json FROM comment_summaries
      WHERE candidate_id = $1
      LIMIT 1`,
      [candidateId],
    )

    // Obtener resumen de la multitud
    const summaryArray = await sql.query(
      `SELECT analysis_date, summary_json, trollanalysis_json FROM daily_summaries
      WHERE candidate_id = $1
      ORDER BY created_at DESC
      LIMIT 7`,
      [candidateId],
    )

    // Formatear respuesta
    const response = {
      id: profile.id,
      candidateId: profile.candidate_id,
      candidateName: profile.candidate_name,
      partido: profile.partido,
      tipoCandidatura: profile.tipo_candidatura,
      overallSentiment: Number.parseFloat(profile.overall_sentiment) || 0,
      //totalComments: profile.total_comments || 0,
      totalComments: total || 0,
      veracityAverage: Number.parseFloat(profile.veracity_average) || 0,
      topicDistribution: profile.topic_distribution || {},
      attributeScores: profile.attribute_scores || {},
      lastUpdated: profile.last_updated,
      trends: recentAnalysis.rows.map((item: any) => ({
        date: item.date,
        sentiment: Number.parseFloat(item.avg_sentiment) || 0,
        commentCount: item.comment_count,
      })),
      sentimentDistribution: sentimentDistribution.rows.map((item: any) => ({
        label: item.sentiment_label,
        count: item.count,
        percentage: Number.parseFloat(item.percentage),
      })),
      summary: crowdSummary.rows.length > 0 ? crowdSummary.rows[0].summary_json : null,
      trollAnalysis: crowdSummary.rows.length > 0 ? crowdSummary.rows[0].trollanalysis_json : null,
      summaryArray: summaryArray.rows.map((item: any) => ({
        analysisDate: item.analysis_date,
        summary: item.summary_json,
        trollAnalysis: item.trollanalysis_json,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error obteniendo perfil de IA:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

// Endpoint para regenerar el perfil de IA
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const candidateId = Number.parseInt(resolvedParams.id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "ID de candidato inválido" }, { status: 400 })
    }

    const sql = await getPool()
    const candidateData = await sql.query(
      `SELECT 
      c.id as candidate_id,
      c.nombre,
      c.partido,
      c.tipo_candidatura,
      c.pais
    FROM candidates c
    WHERE c.id = $1`,
      [candidateId],
    )

    if (candidateData.rows.length === 0) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 })
    }
    // Verificar si ya se hizo el análisis hoy
    const today = new Date().toISOString().split("T")[0]
    const lastAnalysis = await sql.query(
      `SELECT last_analysis_date 
      FROM candidate_ai_profiles 
      WHERE candidate_id = $1`,
      [candidateId],
    )
    //obtener la fecha del último análisis
    const lastAnalysisDate = lastAnalysis.rows[0]?.last_analysis_date

    // Formatear fechas a 'YYYY-MM-DD' para comparación
    const lastAnalysisDateStr = lastAnalysisDate ? new Date(lastAnalysisDate).toISOString().split("T")[0] : null

    if (lastAnalysisDateStr === today) {
      return NextResponse.json({
        success: true,
        message: "El análisis diario ya fue realizado hoy",
        analyzedCount: 0,
        alreadyAnalyzedToday: true,
      })
    }
    let todayContent

    // console.log(`Última fecha de análisis para candidato ${candidateId}:`, lastAnalysisDateStr)
    if (lastAnalysisDateStr === null) {
      todayContent = await sql.query(
        `SELECT 
          p.id,
          p.content,
          p.confirms,
          p.agrees,
          p.disagrees,
          p.es_hecho,
          p.es_opinion,
          p.es_rumor,
          p.created_at,
          'post' as content_type,
          p.id as post_id
        FROM posts p
        WHERE p.candidate_id = $1
          AND p.is_active = 't'
      
        UNION ALL
        
        SELECT
          cm.id,
          cm.content,
          cm.confirms,
          cm.agrees,
          cm.disagrees,
          cm.es_hecho,
          cm.es_opinion,
          cm.es_rumor,
          cm.created_at,
          'comment' as content_type,
          cm.post_id_father as post_id
        FROM comments cm
        JOIN posts p ON cm.post_id_father = p.id
        WHERE p.candidate_id = $1
        AND cm.is_active = 't'
        ORDER BY created_at DESC`,
        [candidateId],
      )
    } else {
      todayContent = await sql.query(
        `WITH today_comments AS (
          SELECT
            cm.id,
            cm.content,
            cm.confirms,
            cm.agrees,
            cm.disagrees,
            cm.es_hecho,
            cm.es_opinion,
            cm.es_rumor,
            cm.created_at,
            'comment' AS content_type,
            cm.post_id_father AS post_id
          FROM comments cm
          JOIN posts p ON cm.post_id_father = p.id
          WHERE p.candidate_id = $1
            AND cm.is_active = 't'
            AND DATE(cm.created_at) = CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1
              FROM comment_analysis ca
              WHERE ca.post_id = cm.id
                AND ca.content_type = 'comment'
            )
        ),

        parent_posts AS (
          SELECT DISTINCT
            p.id,
            p.content,
            p.confirms,
            p.agrees,
            p.disagrees,
            p.es_hecho,
            p.es_opinion,
            p.es_rumor,
            p.created_at,
            'post' AS content_type,
            p.id AS post_id
          FROM posts p
          JOIN today_comments tc ON tc.post_id = p.id
          WHERE NOT EXISTS (
            SELECT 1
            FROM comment_analysis ca
            WHERE ca.post_id = p.id
              AND ca.content_type = 'post'
          )
        ),

        today_posts AS (
          SELECT
            p.id,
            p.content,
            p.confirms,
            p.agrees,
            p.disagrees,
            p.es_hecho,
            p.es_opinion,
            p.es_rumor,
            p.created_at,
            'post' AS content_type,
            p.id AS post_id
          FROM posts p
          WHERE p.candidate_id = $1
            AND p.is_active = 't'
            AND DATE(p.created_at) = CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1
              FROM comment_analysis ca
              WHERE ca.post_id = p.id
                AND ca.content_type = 'post'
            )
        )

        SELECT * FROM today_posts
        UNION ALL
        SELECT * FROM parent_posts
        UNION ALL
        SELECT * FROM today_comments
        ORDER BY created_at DESC
        `,
        [candidateId], // ✅ coma correcta
      )
    }

    let analyzedCount = 0
    let rejectedCount = 0
    const contentToAnalyze = todayContent.rows
    if ( contentToAnalyze.length !== 0) {
      for (const item of contentToAnalyze) {
        try {
          const antispamResponse = await fetch(`${request.nextUrl.origin}/api/ai/analyze-antispam`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentId: item.id,
              contentType: item.content_type,
              candidateId: candidateId,
              content: item.content,
              esHecho: item.es_hecho,
              esOpinion: item.es_opinion,
              esRumor: item.es_rumor,
            }),
          })

          if (antispamResponse.ok) {
            const antispamData = await antispamResponse.json()

            // Solo analizar si fue aprobado
            if (antispamData.moderation.status === "approved") {
              const response = await fetch(`${request.nextUrl.origin}/api/ai/analyze-comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  commentId: item.content_type === "comment" ? item.id : null,
                  postId: item.post_id,
                  candidateId: candidateId,
                  content: item.content,
                  confirms: item.confirms,
                  agrees: item.agrees,
                  disagrees: item.disagrees,
                  esHecho: item.es_hecho,
                  esOpinion: item.es_opinion,
                  esRumor: item.es_rumor,
                  contentType: item.content_type,
                }),
              })

              if (response.ok) {
                analyzedCount++
              }
            } else {
              rejectedCount++
            }
          }
        } catch (error) {
          console.error(`Error procesando ${item.content_type} ${item.id}:`, error)
        }
      }

      if (analyzedCount > 0) {
        await storeDailyMetrics(candidateId, today)
      }

      await sql.query(
        `INSERT INTO candidate_ai_profiles (candidate_id, last_analysis_date, last_updated)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (candidate_id)
        DO UPDATE SET
        last_analysis_date = $2,
        last_updated = CURRENT_TIMESTAMP`,
        [candidateId, today],
      )

      const approvedContent = await sql.query(
        `SELECT 
          p.id, p.user_id, u.alias, p.content, p.confirms, p.agrees, p.disagrees,
          p.es_hecho, p.es_opinion, p.es_rumor, p.created_at,
          'post' as content_type, p.id as post_id, p.content as post_content
        FROM posts p
        JOIN content_moderation cm ON p.id = cm.content_id AND cm.content_type = 'post'
        JOIN users u ON p.user_id = u.id
        WHERE p.candidate_id = $1
          AND cm.status = 'approved'
          AND DATE(p.created_at) = CURRENT_DATE
        
        UNION ALL
        
        SELECT
          c.id, c.user_id, u.alias, c.content, c.confirms, c.agrees, c.disagrees,
          c.es_hecho, c.es_opinion, c.es_rumor, c.created_at,
          'comment' as content_type, c.post_id_father as post_id, p.content as post_content
        FROM comments c
        JOIN posts p ON c.post_id_father = p.id
        JOIN content_moderation cm ON c.id = cm.content_id AND cm.content_type = 'comment'
        JOIN users u ON c.user_id = u.id
        WHERE p.candidate_id = $1
          AND cm.status = 'approved'
          AND DATE(c.created_at) = CURRENT_DATE
        ORDER BY created_at DESC`,
        [candidateId],
      )

      try {
        const summaryResponse = await fetch(`${request.nextUrl.origin}/api/ai/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: candidateId,
            comments: approvedContent.rows,
            days: 120,
            maxComments: 2000,
            includeHistoricalContext: true,
          }),
        })

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          console.log("Resumen actualizado con contexto histórico:", summaryData)
        }
      } catch (error) {
        console.error("Error obteniendo resumen:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Análisis diario completado: ${analyzedCount} elementos nuevos analizados`,
      analyzedCount,
      totalTodayContent: contentToAnalyze.length,
      analysisDate: today,
      isIncrementalAnalysis: true,
    })
  } catch (error) {
    console.error("Error en análisis diario incremental:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

async function storeDailyMetrics(candidateId: number, analysisDate: string) {
  try {
    const sql = await getPool()

    // Get today's analysis metrics
    const dailyStats = await sql.query(
      `SELECT 
      AVG(sentiment_score) as daily_sentiment,
      COUNT(*) as daily_content_count,
      AVG(veracity_score) as daily_veracity,
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
    WHERE candidate_id = $1 AND analysis_date = $2`,
      [candidateId, analysisDate],
    )

    if (dailyStats.rows.length > 0 && dailyStats.rows[0].daily_content_count > 0) {
      const stat = dailyStats.rows[0]

      await sql.query(
        `INSERT INTO daily_analysis_metrics (
        candidate_id, analysis_date, daily_sentiment, daily_content_count,
        daily_veracity_average, daily_topic_distribution, daily_attribute_scores
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (candidate_id, analysis_date)
      DO UPDATE SET
        daily_sentiment = $3,
        daily_content_count = $4,
        daily_veracity_average = $5,
        daily_topic_distribution = $6,
        daily_attribute_scores = $7`,
        [
          candidateId,
          analysisDate,
          stat.daily_sentiment,
          stat.daily_content_count,
          stat.daily_veracity,
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

      //console.log(`Métricas diarias almacenadas para candidato ${candidateId} en fecha ${analysisDate}`)
    }
  } catch (error) {
    console.error("Error almacenando métricas diarias:", error)
  }
}


        // `SELECT 
        //   p.id,
        //   p.content,
        //   p.confirms,
        //   p.agrees,
        //   p.disagrees,
        //   p.es_hecho,
        //   p.es_opinion,
        //   p.es_rumor,
        //   p.created_at,
        //   'post' as content_type,
        //   p.id as post_id
        // FROM posts p
        // WHERE p.candidate_id = $1
        //   AND p.is_active = 't'
        //   AND DATE(p.created_at) = CURRENT_DATE
        //   AND NOT EXISTS (
        //     SELECT 1 FROM comment_analysis ca 
        //     WHERE ca.post_id = p.id AND ca.content_type = 'post'
        // )

        // UNION ALL

        // SELECT
        //   cm.id,
        //   cm.content,
        //   cm.confirms,
        //   cm.agrees,
        //   cm.disagrees,
        //   cm.es_hecho,
        //   cm.es_opinion,
        //   cm.es_rumor,
        //   cm.created_at,
        //   'comment' as content_type,
        //   cm.post_id_father as post_id
        // FROM comments cm
        // JOIN posts p ON cm.post_id_father = p.id
        // WHERE p.candidate_id = $1
        //   AND cm.is_active = 't'
        //   AND DATE(cm.created_at) = CURRENT_DATE
        //   AND NOT EXISTS (
        //     SELECT 1 FROM comment_analysis ca 
        //     WHERE ca.post_id = cm.id AND ca.content_type = 'comment'
        //   )
        // ORDER BY created_at DESC`,