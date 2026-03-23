"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  MessageSquare,
  Shield,
  RefreshCw,
} from "lucide-react";
import {
  formatSentiment,
  formatPercentage,
  getTopTopic,
  getTopAttribute,
} from "../lib/ai-analysis";

import Link from "next/link";
import type { TopicDistribution } from "../lib/ai-analysis";
import type { AttributeScores } from "../lib/ai-analysis";
import {
  Pagination,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

interface CandidateAIProfileProps {
  candidateId: number;
  isGuest: boolean;
}

interface MisinformationFlag {
  note: string;
  claim: string;
}

interface Ideology {
  label: string;
  confidence: string;
  characteristic: string[];
  supportingEvidence: string[];
}

interface Summary {
  praise: string[];
  overview: string;
  criticism: string[];
  sampleQuotes: string[];
  repeatedQuestions: string[];
  misinformationFlags: MisinformationFlag[];
  ideology: Ideology[];
}

interface troll {
  posible_troll_activity: boolean;
  detected_clusters: number;
  troll_score: number;
  summary: string | null;
  sample_patterns: string[] | null;
  sample_messages: Array<{
    alias: string;
    user_id: number;
    content: string;
  }> | null;
}

interface AIProfile {
  id: number;
  candidateId: number;
  candidateName: string;
  partido: string;
  tipoCandidatura: string;
  overallSentiment: number;
  totalComments: number;
  veracityAverage: number;
  topicDistribution: TopicDistribution;
  attributeScores: AttributeScores;
  lastUpdated: string;
  trends: Array<{
    date: string;
    sentiment: number;
    commentCount: number;
  }>;
  sentimentDistribution: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  summary: Summary | null;
  trollAnalysis: troll | null;
  summaryArray?: Array<{
    analysisDate: string;
    summary: Summary | null;
    trollAnalysis: troll | null;
  }> | null;
}

interface User {
  id: number;
}

interface User {
  id: number;
  nombre: string;
  apellido: string;
  alias: string;
  email: string;
  pais: string;
  datos_ocultos: boolean;
  role: string;
}

export default function CandidateAIProfile({
  candidateId,
  isGuest,
}: CandidateAIProfileProps) {
  const [profile, setProfile] = useState<AIProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  //const [existProfile, setExistProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [candidateId]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // useEffect(() => {
  //   if (!loading && profile === null && !regenerating && !existProfile) {
  //     console.log("🧠 Perfil no existe, generando automáticamente...");
  //     setExistProfile(true);
  //     regenerateProfile();
  //   }
  // }, [loading, profile, candidateId]);

  const loadCurrentUser = async () => {
    try {
      if (!isGuest) {
        const response = await fetch("/api/user/current");
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/candidates/${candidateId}/ai-profile`);

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error cargando perfil de IA:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Ejecuta la regeneración cada día a las 00:00:00
  // useEffect(() => {
  //   // Calcula el tiempo restante hasta la próxima medianoche
  //   const now = new Date();
  //   const nextMidnight = new Date(now);
  //   nextMidnight.setHours(24, 0, 0, 0);
  //   const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  //   // Inicializar como null para evitar uso antes de asignación
  //   let timeoutId: ReturnType<typeof setTimeout> | null = null;
  //   let intervalId: ReturnType<typeof setInterval> | null = null;

  //   const scheduleRegeneration = () => {
  //     timeoutId = setTimeout(() => {
  //       // if (!regenerating) {
  //       //   console.log("regeneración inicial ejecutada");
  //       //   regenerateProfile();
  //       // }
  //       // Después de la primera ejecución, programa cada 24h
  //       console.log("NextMidnight alcanzado, programando intervalos diarios", nextMidnight);
  //       //console.log("setInterval para regeneración diaria iniciado", intervalId);
  //       intervalId = setInterval(() => {
  //         if (!regenerating) {
  //           console.log("setInterval para regeneración diaria iniciado", intervalId);
  //           console.log("regeneración diaria ejecutada");
  //           regenerateProfile();
  //         }
  //       }, 86400000);
  //       // }, 60000); // Para pruebas, cada 1 minuto
  //      }, msUntilMidnight);
  //   };

  //   //console.log(`Programando regeneración de perfil de IA en ${msUntilMidnight} ms`);

  //   scheduleRegeneration();

  //   return () => {
  //     if (timeoutId) {
  //       clearTimeout(timeoutId);
  //     }
  //     if (intervalId) {
  //       clearInterval(intervalId);
  //     }
  //   };
  // }, [candidateId, regenerating]);

  const regenerateProfile = async () => {
    try {
      setRegenerating(true);
      const response = await fetch(
        `/api/candidates/${candidateId}/ai-profile`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        const result = await response.json();
        //alert(`✅ ${result.message}`)
        await loadProfile(); // Recargar perfil actualizado
      } else {
        alert("❌ Error regenerando perfil");
      }
    } catch (error) {
      console.error("Error regenerando perfil:", error);
      alert("❌ Error regenerando perfil IA");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Brain className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Cargando análisis de IA...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin Análisis de IA</h3>
          <p className="text-gray-600 mb-4">
            Este candidato aún no tiene suficientes comentarios para generar un
            perfil de IA.
          </p>
          {currentUser && currentUser.role === "admin" ? (
            <Button
              onClick={regenerateProfile}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800"
              disabled={regenerating}
            >
              {regenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generar Análisis
                </>
              )}
            </Button>
          ) : (
            <>
              <span>Contacta a un administrador para generar el análisis.</span>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const sentiment = formatSentiment(profile.overallSentiment);
  const topTopic = getTopTopic(profile.topicDistribution);
  const topAttribute = getTopAttribute(profile.attributeScores);

  const topicNames: Record<string, string> = {
    salud: "Salud",
    educacion: "Educación",
    economia: "Economía",
    seguridad: "Seguridad",
    corrupcion: "Corrupción",
    medio_ambiente: "Medio Ambiente",
    tecnologia: "Tecnología",
  };

  const attributeNames: Record<string, string> = {
    corrupto: "Corrupto",
    transparente: "Transparente",
    experimentado: "Experimentado",
    confiable: "Confiable",
    populista: "Populista",
  };

  return (
    <div className="space-y-6">
      {/* Header con información general */}
      <Card>
        <div className="text-right px-4 pt-2">
          <span className="text-sm text-gray-500">
            Fecha de Análisis:{" "}
            {profile.summaryArray?.[currentPage]?.analysisDate
              ? new Date(
                  profile.summaryArray[currentPage]!.analysisDate,
                ).toLocaleString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  // hour: "2-digit",
                  // minute: "2-digit",
                })
              : "Sin fecha"}
          </span>
        </div>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-blue-500" />
            <div>
              <CardTitle>Perfil de IA - {profile.candidateName}</CardTitle>
              <p className="text-sm text-gray-600">
                {profile.partido} • {profile.tipoCandidatura}
              </p>
            </div>
          </div>
          {currentUser?.role === "admin" ? (
            <Button
              variant="outline"
              onClick={regenerateProfile}
              disabled={regenerating}
            >
              {regenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              {/* <div className="text-2xl font-bold">{profile.totalComments}</div> */}
              <div className="text-2xl font-bold">{profile.totalComments}</div>
              <div className="text-sm text-gray-600">Comentarios</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${sentiment.color}`}>
                {sentiment.label}
              </div>
              <div className="text-sm text-gray-600">Sentimiento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(profile.veracityAverage)}%
              </div>
              <div className="text-sm text-gray-600">Veracidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{topTopic.name}</div>
              <div className="text-sm text-gray-600">Tema Principal</div>
              {/* {profile.summary ? `Resumen de la multitud: ${profile.summary.overview}` : "No hay resumen disponible."} */}
            </div>
          </div>

          {/* <div>
            <h3 className="mt-6 text-lg font-semibold">
              Breve resumen de comentarios:
            </h3>
            <p className="mt-4 text-md text-gray-600">
              {profile.summary
                ? `${profile.summary.overview}`
                : "No hay resumen disponible."}
            </p>
            <h3 className="mt-6 text-lg font-semibold">Elogios:</h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summary
                ? profile.summary.praise.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item}
                    </li>
                  ))
                : "No hay elogios disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">Críticas:</h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summary
                ? profile.summary.criticism.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item}
                    </li>
                  ))
                : "No hay criticas disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">
              Citas textuales de comentarios:
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summary
                ? profile.summary.sampleQuotes.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item}
                    </li>
                  ))
                : "No hay citas textuales disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">
              Comentarios que pueden resultar en desinformación:
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summary
                ? profile.summary.misinformationFlags.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item.note}
                    </li>
                  ))
                : "No hay citas textuales disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">
              Posible spam automatizado y manipulación coordinada (trolls/bots).
            </h3>
            <p className="mt-4 text-md text-gray-600">
              {profile.trollAnalysis
                ? `${profile.trollAnalysis.summary}`
                : "No hay resumen disponible."}
            </p>
            <p className="mt-4 text-md font-bold text-gray-800">
              Publicaciones sospechosas:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              {profile.trollAnalysis
                ? profile.trollAnalysis.sample_patterns?.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item}
                    </li>
                  ))
                : "No hay citas textuales disponibles."}
            </ul>
            <ul className="list-disc list-inside space-y-2 mt-2">
              {profile.trollAnalysis
                ? profile.trollAnalysis.sample_messages?.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-bold">{item.alias} ({item.user_id}): </span>{item.content}
                    </li>
                  ))
                : "No hay citas textuales disponibles."}
            </ul>
          </div> */}

          <div>
            <h3 className="mt-6 text-lg font-semibold">
              Breve resumen de comentarios:
            </h3>
            <p className="mt-4 text-md text-gray-600">
              {profile.summaryArray?.[currentPage]?.summary?.overview ??
                "No hay resumen disponible."}
            </p>
            <h3 className="mt-6 text-lg font-semibold">Elogios:</h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summaryArray?.[currentPage]?.summary?.praise.map(
                (item, index) => (
                  <li key={index} className="text-gray-700">
                    {item}
                  </li>
                ),
              ) ?? "No hay elogios disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">Críticas:</h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summaryArray?.[currentPage]?.summary?.criticism.map(
                (item, index) => (
                  <li key={index} className="text-gray-700">
                    {item}
                  </li>
                ),
              ) ?? "No hay criticas disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">
              Citas textuales de comentarios:
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summaryArray?.[currentPage]?.summary?.sampleQuotes.map(
                (item, index) => (
                  <li key={index} className="text-gray-700">
                    {item}
                  </li>
                ),
              ) ?? "No hay citas textuales disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">
              Comentarios que pueden resultar en desinformación:
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {profile.summaryArray?.[
                currentPage
              ]?.summary?.misinformationFlags.map((item, index) => (
                <li key={index} className="text-gray-700">
                  {item.note}
                </li>
              )) ?? "No hay citas textuales disponibles."}
            </ul>
            <h3 className="mt-6 text-lg font-semibold">
              Posible spam automatizado y manipulación coordinada (trolls/bots).
            </h3>
            <p className="mt-4 text-md text-gray-600">
              {profile.summaryArray?.[currentPage]?.trollAnalysis &&
              profile.summaryArray?.[currentPage]?.trollAnalysis.troll_score >
                0.5
                ? `${profile.summaryArray?.[currentPage]?.trollAnalysis.summary}`
                : "No hay actividad sospechosa."}
            </p>
            <p className="mt-4 text-md font-bold text-gray-800">
              Publicaciones sospechosas:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-600">
              {profile.summaryArray?.[currentPage]?.trollAnalysis &&
              profile.summaryArray?.[currentPage]?.trollAnalysis.troll_score >
                0.5
                ? profile.summaryArray?.[
                    currentPage
                  ]?.trollAnalysis.sample_messages?.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {/* <Link
                        href={`/profile/${item.user_id}`}
                        className="font-bold"
                      >
                        <span>{item.alias} ({item.user_id}): </span>
                      </Link> */}
                      <Link
                        href={`/profile/${item.user_id}`}
                        className="font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {item.alias}:
                      </Link>
                      &nbsp;{item.content}
                    </li>
                  ))
                : "No hay publicaciones sospechosas."}
            </ul>
          </div>
        </CardContent>
        <div className="flex justify-center mt-2">
          <span className="text-lg text-center font-semibold">
            Últimos 7 días
          </span>
        </div>
        <Pagination className="my-2 text-center text-xs text-gray-500">
          {/* <PaginationPrevious>Comentarios Página 2 de 7</PaginationPrevious> */}
          <div className="inline-flex space-x-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Button
                key={i}
                className={`px-2 py-1 text-xs rounded-md ${
                  i === currentPage
                    ? "bg-purple-600 text-white hover:bg-blue-600"
                    : "bg-gray-400 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentPage(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          {/* <PaginationNext>Comentarios Página 2 de 7</PaginationNext> */}
        </Pagination>
      </Card>

      {/* <CardTitle>
        Ideología política según la percepción de los usuarios
      </CardTitle>
      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topics">Caracteristicas</TabsTrigger>
          <TabsTrigger value="attributes">Evidencia</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Características
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.summary
                ? profile.summary?.ideology.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-left">
                        <span className="font-medium">{item.label}/</span>
                        <span className="font-medium">{item.confidence}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-2">
                        {item.characteristic.map((char, i) => (
                          <li
                            key={i}
                            className="list-disc list-inside text-gray-700"
                          >
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                : "No hay características disponibles."}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Evidencia de apoyo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.summary
                ? profile.summary?.ideology.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-left">
                        <span className="font-medium">{item.label}/</span>
                        <span className="font-medium">{item.confidence}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-2">
                        {item.supportingEvidence.map((evidence, i) => (
                          <li
                            key={i}
                            className="list-disc list-inside text-gray-700"
                          >
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                : "No hay características disponibles."}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs> */}

      {/* Tabs con análisis detallado */}
      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="topics">Temas Políticos</TabsTrigger>
          <TabsTrigger value="attributes">Atributos</TabsTrigger>
          <TabsTrigger value="sentiment">Sentimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Distribución de Temas Políticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profile.topicDistribution).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {topicNames[key] || key}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatPercentage(value)}
                    </span>
                  </div>
                  <Progress value={value * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Atributos de Personalidad Política
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profile.attributeScores).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {attributeNames[key] || key}
                    </span>
                    <Badge
                      variant={
                        value > 0.6
                          ? "destructive"
                          : value > 0.3
                            ? "default"
                            : "secondary"
                      }
                    >
                      {formatPercentage(value)}
                    </Badge>
                  </div>
                  <Progress value={value * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Análisis de Sentimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.sentimentDistribution.map((item) => (
                  <div
                    key={item.label}
                    className="text-center p-4 border rounded-lg"
                  >
                    <div className="text-2xl font-bold mb-2">{item.count}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      {item.label === "positive"
                        ? "Positivos"
                        : item.label === "negative"
                          ? "Negativos"
                          : "Neutrales"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-gray-500 text-center">
        Última actualización: {new Date(profile.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}

export { CandidateAIProfile };
