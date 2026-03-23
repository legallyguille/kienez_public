import { getPool } from "@/lib/db"

// Función auxiliar para obtener la URL base
function getBaseUrl() {
    // En el cliente
    if (typeof window !== 'undefined') {
        return '';
    }

    // En el servidor (Vercel)
    if (process.env.VERCEL_URL) {
        // https://vercel.com/docs/projects/environment-variables/system-environment-variables
        const vercelUrl = process.env.VERCEL_URL;
        // Asegurar que tenga https://
        if (vercelUrl.startsWith('http')) {
            return vercelUrl;
        }
        return `https://${vercelUrl}`;
    }

    // Variable personalizada (configúrala en Vercel)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    // Desarrollo local
    return 'http://localhost:3000';
}

export async function regenerateCandidateProfile() {

    const sql = await getPool()
    const candidates = await sql.query(`
    SELECT id
    FROM candidates
    WHERE activo = 'true' AND finalized = 'false'
  `);

    for (const candidate of candidates.rows) {
        // console.log("🧠 Regenerando:", candidate.id);

        // await generateAIProfile(candidate.id, getBaseUrl());
        await generateAIProfile(candidate.id);
    }
}

// async function generateAIProfile(id: string, baseUrl?: string) {
async function generateAIProfile(id: string) {
    const candidateId = Number.parseInt(id);   
    // Usar la baseUrl pasada como parámetro o calcularla
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (isNaN(candidateId)) {
        throw new Error("ID de candidato inválido");
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
        throw new Error("Candidato no encontrado");
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
        console.log(`El candidato ${candidateId} ya fue analizado hoy.`)
        return
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
    if (contentToAnalyze.length !== 0) {
        for (const item of contentToAnalyze) {
            try {
                const antispamResponse = await fetch(`${baseUrl}/api/ai/analyze-antispam`, {
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
                        const response = await fetch(`${baseUrl}/api/ai/analyze-comments`, {
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
            const summaryResponse = await fetch(`${baseUrl}/api/ai/summarize`, {
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