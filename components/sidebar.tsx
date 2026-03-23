"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LegalLinks } from "@/components/legal-links";
import { ContactUs } from "@/components/contact-us";

interface CandidateType {
  value: string;
  label: string;
}

interface Candidate {
  id: number;
  nombre: string;
  partido: string;
  tipo_candidatura: string;
  ranking: number;
  seguidores: number;
  foto_url?: string;
  pais: string;
  finalized?: boolean;
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

export function Sidebar({ isGuest }: { isGuest: boolean }) {
  const [candidateTypes, setCandidateTypes] = useState<CandidateType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCandidateTypes();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedType && currentUser) {
      loadCandidates(selectedType, currentUser.pais);
    } else {
      setCandidates([]);
    }
  }, [selectedType, currentUser]);

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

  const loadCandidateTypes = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Cargar tipos de candidatura disponibles para el país del usuario
      const response = await fetch(
        `/api/candidates/types?pais=${encodeURIComponent(currentUser.pais)}`,
      );
      const data = await response.json();
      setCandidateTypes(data);

      // Seleccionar automáticamente el primer tipo si existe
      if (data.length > 0) {
        setSelectedType(data[0].value);
      }
    } catch (error) {
      console.error("Error loading candidate types:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async (type: string, userCountry: string) => {
    setLoadingCandidates(true);
    try {
      // Filtrar candidatos por tipo y país del usuario
      const response = await fetch(
        `/api/candidates?tipo=${encodeURIComponent(
          type,
        )}&pais=${encodeURIComponent(userCountry)}`,
      );
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : (data.candidates ?? []));
    } catch (error) {
      console.error("Error loading candidates:", error);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

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

  // Mostrar loading mientras se carga el usuario
  if (loadingUser) {
    return (
      <aside className="lg:max-w-2xl mx-auto sm:w-5/6 md:w-3/4 lg:w-1/3 p-2 top-20 h-fit">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando...</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    );
  }

  // Si no hay usuario logueado, no mostrar candidatos
  if (!currentUser) {
    return (
      <aside className="lg:max-w-2xl mx-auto sm:w-5/6 md:w-3/4 lg:w-1/3 p-2 top-20 h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Postulantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                Inicia sesión para ver candidatos de tu país
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    // <aside className="w-80 p-4 sticky top-20 h-fit">
    <aside className="lg:max-w-2xl mx-auto sm:w-5/6 md:w-3/4 lg:w-1/3 p-2 top-20 h-fit">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Postulantes de {formatCountryName(currentUser.pais)}
            {/* <span className="text-sm font-normal text-gray-500 block mt-1">🌍 Mostrando candidatos de tu país</span> */}
          </CardTitle>

          {/* Selector de Tipo de Candidatura */}
          <div className="mt-3">
            <Select
              value={selectedType}
              onValueChange={handleTypeChange}
              disabled={loading || candidateTypes.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loading
                      ? "Cargando tipos..."
                      : candidateTypes.length === 0
                        ? "No hay tipos disponibles"
                        : "Selecciona tipo de candidatura"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {candidateTypes.length > 0 ? (
                  candidateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-types" disabled>
                    No hay tipos disponibles en{" "}
                    {formatCountryName(currentUser.pais)}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Lista de Candidatos */}
          {loadingCandidates ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">
                Cargando candidatos...
              </p>
            </div>
          ) : candidates.length > 0 ? (
            <>
              {/* Contador de candidatos */}
              <div className="text-sm text-gray-600 pb-2 border-b">
                {candidates.length} candidato
                {candidates.length !== 1 ? "s" : ""} encontrado
                {candidates.length !== 1 ? "s" : ""} en{" "}
                {formatCountryName(currentUser.pais)}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {/* Lista de candidatos */}
                {candidates.map(
                  (candidate, index) =>
                    candidate.finalized !== true && (
                      <Link
                        key={candidate.id}
                        href={`/candidates/${candidate.id}`}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Badge
                          variant="secondary"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-800"
                        >
                          {index + 1}
                          {/* {candidate.ranking}  */}
                        </Badge>
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={
                              candidate.foto_url ||
                              `/placeholder.svg?height=40&width=40&text=${
                                candidate.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"
                              }`
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {candidate.nombre
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate hover:text-blue-600 transition-colors">
                            {candidate.nombre}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {candidate.partido}
                          </p>
                          {/* <p className="text-xs text-blue-600 font-medium">
                        {formatFollowers(candidate.seguidores)} seguidores
                      </p> */}
                        </div>
                      </Link>
                    ),
                )}
              </div>
            </>
          ) : selectedType ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  No hay candidatos de tipo "{selectedType}" en{" "}
                  {formatCountryName(currentUser.pais)}
                </p>
                <p className="text-xs text-yellow-600">
                  💡 Puedes crear nuevos candidatos desde la gestión de
                  postulantes
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                Selecciona un tipo de candidatura para ver los postulantes de{" "}
                {formatCountryName(currentUser.pais)}
              </p>
            </div>
          )}

          {/* Información adicional y botón de gestión */}
          <div className="pt-4 border-t mt-4 space-y-3">
            {/* Información del filtro */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🌍</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900">Filtro por país activo</p>
                  <p className="text-xs text-blue-700">
                    Solo se muestran candidatos de {formatCountryName(currentUser.pais)}
                  </p>
                </div>
              </div>
            </div> */}

            {/* Botón de gestión */}
            {currentUser.role === "admin" && (
              <Link href="/candidates/manage">
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-gray-50"
                >
                  Gestionar Postulantes
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
      <ContactUs />
      <LegalLinks />
    </aside>
  );
}
