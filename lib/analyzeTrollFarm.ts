import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { es } from "date-fns/locale"
import { z } from "zod"

export const TrollFarmSchema = z.object({
  possible_troll_activity: z.boolean(),
  detected_clusters: z.number().int().nonnegative(),
  troll_score: z.number().min(0).max(1),
  summary: z.string().optional(),
  sample_patterns: z.array(z.string()).optional(),
  sample_messages: z
    .array(
      z.object({
        alias: z.string(),
        user_id: z.number(),
        content: z.string(),
        es_hecho: z.boolean().optional(),
        es_opinion: z.boolean(),
        es_rumor: z.boolean(),
      })
    )
    .optional(),
})

/**
 * Analiza colectivamente publicaciones y comentarios para detectar patrones de actividad coordinada
 * (granja de trolls), considerando también el análisis del día anterior para identificar persistencia
 * o evolución en la actividad sospechosa.
 */
export async function analyzeTrollFarmActivity(
  postsAndComments: Array<{
    id: number
    user_id: number
    alias: string
    content: string
    created_at: string
    es_hecho: boolean
    es_opinion: boolean
    es_rumor: boolean
  }>,
  previousTrollAnalysis?: string,
  previousDate?: string
) {
  if (!postsAndComments || postsAndComments.length === 0) {
    return {
      possible_troll_activity: false,
      detected_clusters: 0,
      troll_score: 0,
      sample_patterns: [],
      summary: "Sin suficiente información para análisis colectivo.",
    }
  }

  const combinedText = postsAndComments
    .map(
      (p) =>
        `[${p.created_at}] Usuario ${p.alias} (${p.user_id}): ${p.content.replace(/\n/g, " ")} (Hecho: ${p.es_hecho}, Opinión: ${p.es_opinion}, Rumor: ${p.es_rumor})`
    )
    .join("\n")

  try {
    const { object: analysis } = await generateObject({
      model: openai("gpt-4o"),
      schema: TrollFarmSchema,
      prompt: `
        Analiza los siguientes mensajes de usuarios en una red social para determinar si existe evidencia de actividad
        coordinada o una posible "granja de trolls". No censures ni elimines contenido; tu objetivo es identificar
        patrones sospechosos con precisión analítica.

        === CONTEXTO HISTÓRICO ===
        Fecha del análisis anterior: ${previousDate || "No disponible"}
        Resumen anterior:
        ${previousTrollAnalysis || "Sin datos previos."}

        === MENSAJES DEL DÍA ACTUAL ===
        ${combinedText}

        === INSTRUCCIONES ===
        1. Compara los mensajes del día con el análisis anterior, si existe.
        2. Toma en cuenta si el comentario es un hecho, opinión o rumor.
        3. Evalúa si los patrones sospechosos persisten, cambian de tono o muestran una evolución.
        4. Busca indicios de coordinación entre usuarios distintos:
           - Mensajes con frases o estructuras idénticas.
           - Publicaciones simultáneas o muy próximas en tiempo.
           - Narrativas o eslóganes replicados (por ejemplo, mismos hashtags o calificativos).
        5. Considera también la posibilidad de que nuevos usuarios estén replicando mensajes antiguos.
        6. No asumas coordinación solo por coincidencias de opinión; enfócate en la repetición semántica o temporal.

        === CRITERIOS DE SALIDA ===
        - possible_troll_activity: true/false
        - detected_clusters: cantidad estimada de grupos o patrones coordinados.
        - troll_score: 0 (sin indicios) a 1 (actividad altamente coordinada).
        - summary: breve resumen del hallazgo, mencionando continuidad si aplica.
        - sample_patterns: lista breve de frases repetitivas o patrones lingüísticos
        - sample_messages: lista de ejemplos estructurados con alias, user_id y contenido

        Sé riguroso pero equilibrado: una coincidencia de opinión política no implica coordinación; busca evidencia
        de sincronía o comportamiento artificial.
      `,
    })

    return analysis
  } catch (error) {
    console.error("Error en análisis colectivo antitroll:", error)
    return {
      possible_troll_activity: false,
      detected_clusters: 0,
      troll_score: 0,
      sample_patterns: [],
      summary: "Error durante el análisis colectivo antitroll.",
    }
  }
}
