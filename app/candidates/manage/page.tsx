"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, Edit, PlusCircle, Trash, CalendarOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

type Candidate = {
  id: number;
  nombre: string;
  partido: string;
  tipo_candidatura: string;
  foto_url?: string;
  pais: string;
  finalized: boolean;
};

export default function ManageCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [finalizeId, setFinalizeId] = useState<number | null>(null);
  const [enabledId, setEnabledId] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    if (candidates.length > 0) {
      const countries = [...new Set(candidates.map((c) => c.pais))].sort();
      setAvailableCountries(countries);
    }
  }, [candidates]);

  useEffect(() => {
    if (candidates.length > 0) {
      let candidatesToFilter = candidates;
      if (selectedCountry) {
        candidatesToFilter = candidates.filter(
          (c) => c.pais === selectedCountry
        );
      }
      const types = [
        ...new Set(candidatesToFilter.map((c) => c.tipo_candidatura)),
      ].sort();
      setAvailableTypes(types);

      if (selectedType && !types.includes(selectedType)) {
        setSelectedType("");
      }
    }
  }, [candidates, selectedCountry]);

  useEffect(() => {
    let filtered = candidates;

    if (selectedCountry) {
      filtered = filtered.filter((c) => c.pais === selectedCountry);
    }

    if (selectedType) {
      filtered = filtered.filter((c) => c.tipo_candidatura === selectedType);
    }

    setFilteredCandidates(filtered);
  }, [candidates, selectedCountry, selectedType]);

  const loadCandidates = async () => {
    try {
      const response = await fetch("/api/candidates");
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : data.candidates ?? []);
      setFilteredCandidates(Array.isArray(data) ? data : data.candidates ?? []);
    } catch (error) {
      console.error("Error loading candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  //console.log("candidates:", filteredCandidates);

  const handleDelete = async (candidateId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este candidato?")) {
      setDeletingId(candidateId);
      try {
        const response = await fetch(`/api/candidates/${candidateId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setCandidates((prevCandidates) =>
            prevCandidates.filter((candidate) => candidate.id !== candidateId)
          );

          console.log("Candidato eliminado exitosamente");
        } else {
          const errorData = await response.json();
          alert(`Error al eliminar candidato: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error deleting candidate:", error);
        alert("Error al eliminar candidato. Por favor, intenta de nuevo.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleFinalize = async (candidateId: number, finalized: boolean) => {
    if (confirm("¿Estás seguro de que quieres finalizar este candidato?")) {
      setFinalizeId(candidateId);
      try {
        const response = await fetch(`/api/candidates/${candidateId}?finalized=${finalized}`, {
          method: "PATCH",
        });

        if (response.ok) {
          setCandidates((prevCandidates) =>
            prevCandidates.filter((candidate) => candidate.id !== candidateId)
          );

          console.log("Candidato eliminado exitosamente");
        } else {
          const errorData = await response.json();
          alert(`Error al eliminar candidato: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error deleting candidate:", error);
        alert("Error al eliminar candidato. Por favor, intenta de nuevo.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const clearFilters = () => {
    setSelectedCountry("");
    setSelectedType("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
          <Link href="/candidates/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Crear Nuevo Postulante
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Gestión de Postulantes
            </CardTitle>
            <CardDescription>
              Administra los candidatos políticos en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por país" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountries.map((country) => (
                      <SelectItem
                        key={country}
                        value={country}
                        className="capitalize"
                      >
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por tipo de candidatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="capitalize"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(selectedCountry || selectedType) && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead>Tipo de Candidatura</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Cargando candidatos...
                    </TableCell>
                  </TableRow>
                ) : filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={
                              candidate.foto_url ||
                              `/placeholder.svg?height=40&width=40&text=${
                                candidate.nombre
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("") || "/placeholder.svg"
                              }`
                            }
                          />
                          <AvatarFallback>
                            {candidate.nombre
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {candidate.nombre}
                      </TableCell>
                      <TableCell>{candidate.partido}</TableCell>
                      <TableCell className="capitalize">
                        {candidate.tipo_candidatura}
                      </TableCell>
                      <TableCell className="capitalize">
                        {candidate.pais}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/candidates/edit/${candidate.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(candidate.id)}
                            disabled={deletingId === candidate.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            {deletingId === candidate.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </Button>
                              
                          {!candidate.finalized
                            ?
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleFinalize(candidate.id, candidate.finalized);
                              }}
                              disabled={finalizeId === candidate.id}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              {candidate.finalized}
                              <CalendarOff className="w-4 h-4 mr-2" />
                              {finalizeId === candidate.id
                                ? "Finalizando..."
                                : "Finalizar"}
                            </Button>
                            :
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleFinalize(candidate.id, candidate.finalized);
                              }}
                              disabled={enabledId === candidate.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              {enabledId === candidate.id
                                ? "Habilitando..."
                                : "Habilitar"}
                            </Button>                            
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      {selectedCountry || selectedType
                        ? "No hay candidatos que coincidan con los filtros seleccionados."
                        : "No hay candidatos registrados."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
