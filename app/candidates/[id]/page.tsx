export const runtime = "nodejs";
//"use client"

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreatePost } from "@/components/create-post";
import { CandidatePosts } from "@/components/candidate-posts";
import { CandidateAIProfile } from "@/components/candidate-ai-profile";
import { Users, MapPin, Calendar, ExternalLink } from "lucide-react";
import { getPool } from "@/lib/db";
import { notFound } from "next/navigation";

interface CandidatePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getCandidate(id: number) {
  try {
    const sql = await getPool();
    const candidates = await sql.query(
      `
      SELECT id, nombre, partido, tipo_candidatura, descripcion, pais, ranking, seguidores, foto_url, activo, created_at
      FROM candidates 
      WHERE id = $1 AND activo = true
    `,
      [id],
    );

    if (candidates.rows.length === 0) {
      return null;
    }

    return candidates.rows[0];
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return null;
  }
}

export default async function CandidatePage({
  params,
  searchParams,
}: CandidatePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const candidateId = Number.parseInt(resolvedParams.id);
  const isGuest = resolvedSearchParams?.isGuest === "true";

  if (isNaN(candidateId)) {
    notFound();
  }

  const candidate = await getCandidate(candidateId);

  if (!candidate) {
    notFound();
  }

  const formatCountryName = (country: string): string => {
    const countryMap: { [key: string]: string } = {
      argentina: "Argentina",
      bolivia: "Bolivia",
      brasil: "Brasil",
      chile: "Chile",
      colombia: "Colombia",
      "costa-rica": "Costa Rica",
      cuba: "Cuba",
      ecuador: "Ecuador",
      "el-salvador": "El Salvador",
      espana: "España",
      guatemala: "Guatemala",
      honduras: "Honduras",
      mexico: "México",
      nicaragua: "Nicaragua",
      panama: "Panamá",
      paraguay: "Paraguay",
      peru: "Perú",
      "puerto-rico": "Puerto Rico",
      "republica-dominicana": "República Dominicana",
      uruguay: "Uruguay",
      venezuela: "Venezuela",
      "estados-unidos": "Estados Unidos",
      canada: "Canadá",
      francia: "Francia",
      alemania: "Alemania",
      italia: "Italia",
      "reino-unido": "Reino Unido",
      portugal: "Portugal",
    };

    return (
      countryMap[country.toLowerCase()] ||
      country.charAt(0).toUpperCase() + country.slice(1)
    );
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const formatCandidateType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      presidente: "Candidato Presidencial",
      diputado: "Candidato a Diputado",
      alcalde: "Candidato a Alcalde",
      regidor: "Candidato a Regidor",
      senador: "Candidato a Senador",
      gobernador: "Candidato a Gobernador",
      concejal: "Candidato a Concejal",
      otro: "Otro Candidato",
    };

    return (
      typeMap[type.toLowerCase()] ||
      `Candidato a ${type.charAt(0).toUpperCase() + type.slice(1)}`
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto pt-20">
        {/* Portada del perfil del candidato */}
        <Card className="mb-6">
          <div className="relative">
            {/* Foto de portada */}
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative">
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-lg"></div>
              <div className="absolute bottom-4 right-4">
                <div className="flex flex-col space-y-2 ml-6">
                  {/* <Button className="bg-blue-600 hover:bg-blue-700">
                    <Users className="w-4 h-4 mr-2" />
                    Seguir
                  </Button> */}
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Compartir perfil
                  </Button>
                </div>
                {/* <Badge variant="secondary" className="bg-white/90 text-gray-800">
                  Perfil Público
                </Badge> */}
              </div>
            </div>

            {/* Foto de perfil */}
            <div className="absolute -bottom-16 left-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white">
                  <AvatarImage
                    src={
                      candidate.foto_url ||
                      `/placeholder.svg?height=128&width=128&text=${candidate.nombre
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}`
                    }
                  />
                  <AvatarFallback className="text-2xl">
                    {candidate.nombre
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {/* Ranking badge */}
                <div className="absolute -bottom-2 -right-2">
                  <Badge className="bg-blue-600 text-white text-sm font-bold px-2 py-1">
                    #{candidate.ranking}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="pt-20 pb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {candidate.nombre}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {formatCandidateType(candidate.tipo_candidatura)}
                  </Badge>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {formatCountryName(candidate.pais)}
                    </span>
                  </div>
                  {/* <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">{formatFollowers(candidate.seguidores)} seguidores</span>
                  </div> */}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Partido Político
                  </h3>
                  <p className="text-gray-700 font-medium">
                    {candidate.partido}
                  </p>
                </div>

                {candidate.descripcion && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Descripción
                    </h3>
                    <p className="text-blue-800 leading-relaxed">
                      {candidate.descripcion}
                    </p>
                  </div>
                )}

                {/* Adding AI profile dropdown below description */}
                <CandidateAIProfile candidateId={candidate.id} isGuest={isGuest} />

                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    Perfil creado el {formatDate(candidate.created_at)}
                  </span>
                </div>
              </div>

              {/* <div className="flex flex-col space-y-2 ml-6">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Seguir
                </Button>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Compartir perfil
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas del candidato */}
        {/* <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{formatFollowers(candidate.seguidores)}</div>
                <div className="text-sm text-blue-700">Seguidores</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">#{candidate.ranking}</div>
                <div className="text-sm text-green-700">Ranking</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCountryName(candidate.pais)}</div>
                <div className="text-sm text-purple-700">País</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{candidate.partido.split(" ")[0]}</div>
                <div className="text-sm text-orange-700">Partido</div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Contenido del perfil */}
        <div className="space-y-6">
        
          <CreatePost
            preselectedCandidate={{
              id: candidate.id,
              nombre: candidate.nombre,
              partido: candidate.partido,
              tipo_candidatura: candidate.tipo_candidatura,
              pais: candidate.pais,
            }}
            isGuest = {isGuest}
          />
          <CandidatePosts
            candidateId={candidate.id}
            candidateName={candidate.nombre}
            isGuest={isGuest}
          />
        </div>
      </div>
    </div>
  );
}
