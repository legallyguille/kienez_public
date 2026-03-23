// Utilidades para análisis de IA política

export interface SentimentAnalysis {
  score: number // -1 a 1
  label: "positive" | "negative" | "neutral"
}

export interface TopicDistribution {
  salud: number
  educacion: number
  economia: number
  seguridad: number
  corrupcion: number
  medio_ambiente: number
  tecnologia: number
}

export interface AttributeScores {
  corrupto: number
  transparente: number
  experimentado: number
  confiable: number
  populista: number
}

export interface CommentAnalysis {
  id: number
  commentId: number
  postId: number
  candidateId: number
  sentiment: SentimentAnalysis
  topics: TopicDistribution
  veracity: number
  attributes: AttributeScores
  confidence: number
  analyzedAt: string
}

export interface CandidateAIProfile {
  id: number
  candidateId: number
  overallSentiment: number
  totalComments: number
  topicDistribution: TopicDistribution
  attributeScores: AttributeScores
  veracityAverage: number
  lastUpdated: string
}

// Función para analizar un comentario automáticamente
export async function analyzeComment(
  commentId: number,
  postId: number,
  candidateId: number,
  content: string,
): Promise<boolean> {
  try {
    const response = await fetch("/api/ai/analyze-comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commentId,
        postId,
        candidateId,
        content,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error analizando comentario:", error)
    return false
  }
}

// Función para obtener el perfil de IA de un candidato
export async function getCandidateAIProfile(candidateId: number): Promise<CandidateAIProfile | null> {
  try {
    const response = await fetch(`/api/candidates/${candidateId}/ai-profile`)
    if (!response.ok) return null

    return await response.json()
  } catch (error) {
    console.error("Error obteniendo perfil de IA:", error)
    return null
  }
}

// Función para formatear el sentimiento
export function formatSentiment(score: number): { label: string; color: string } {
  if (score > 0.3) return { label: "Positivo", color: "text-green-600" }
  if (score < -0.3) return { label: "Negativo", color: "text-red-600" }
  return { label: "Neutral", color: "text-gray-600" }
}

// Función para obtener el color de un atributo
export function getAttributeColor(value: number): string {
  //console.log("Attribute value:", value)
  if (value > 0.7) return "bg-red-500"
  if (value > 0.4) return "bg-yellow-500"
  return "bg-green-500"
}

// Función para formatear porcentajes
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

// Función para obtener el tema más relevante
export function getTopTopic(topics: TopicDistribution): { name: string; score: number } {
  const entries = Object.entries(topics)

  // Handle empty topics object
  if (entries.length === 0) {
    return { name: "Sin datos", score: 0 }
  }

  const [name, score] = entries.reduce((max, current) => (current[1] > max[1] ? current : max), entries[0])

  const topicNames: Record<string, string> = {
    salud: "Salud",
    educacion: "Educación",
    economia: "Economía",
    seguridad: "Seguridad",
    corrupcion: "Corrupción",
    medio_ambiente: "Medio Ambiente",
    tecnologia: "Tecnología",
  }

  return { name: topicNames[name] || name, score }
}

// Función para obtener el atributo más prominente
export function getTopAttribute(attributes: AttributeScores): { name: string; score: number } {
  const entries = Object.entries(attributes)

  // Handle empty attributes object
  if (entries.length === 0) {
    return { name: "Sin datos", score: 0 }
  }

  const [name, score] = entries.reduce((max, current) => (current[1] > max[1] ? current : max), entries[0])

  const attributeNames: Record<string, string> = {
    corrupto: "Corrupto",
    transparente: "Transparente",
    experimentado: "Experimentado",
    confiable: "Confiable",
    populista: "Populista",
  }

  return { name: attributeNames[name] || name, score }
}

// Función para obtener el resumen diario de un candidato
export async function getDailySummary(candidateId: number, date?: string): Promise<any | null> {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0]
    const response = await fetch(`/api/ai/summarize/daily?candidateId=${candidateId}&date=${targetDate}`)
    if (!response.ok) return null

    return await response.json()
  } catch (error) {
    console.error("Error obteniendo resumen diario:", error)
    return null
  }
}

// Función para generar el resumen diario de un candidato
export async function triggerDailySummary(candidateId: number): Promise<boolean> {
  try {
    const response = await fetch("/api/ai/summarize/daily", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ candidateId }),
    })

    return response.ok
  } catch (error) {
    console.error("Error generando resumen diario:", error)
    return false
  }
}
