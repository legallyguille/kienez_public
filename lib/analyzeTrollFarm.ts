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
        Eres un analista que detecta granjas de trolls
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
