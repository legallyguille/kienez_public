"use client";

import React, { useState, useEffect, useCallback, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  ImageIcon,
  Video,
  Smile,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPost } from "@/app/actions/posts";

interface PreselectedCandidate {
  id: number;
  nombre: string;
  partido: string;
  tipo_candidatura: string;
  pais: string;
}

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
  profile_image_url: string;
}

interface CreatePostProps {
  onPostCreated?: () => void;
  preselectedCandidate?: PreselectedCandidate;
  isGuest?: boolean;
}

type ContentType = "hecho" | "opinion" | "rumor";

const initialState = {
  success: false,
  message: "",
};

export function CreatePost({
  onPostCreated,
  preselectedCandidate,
  isGuest,
}: CreatePostProps) {
  const [candidateTypes, setCandidateTypes] = useState<CandidateType[]>([]);
  const [selectedCandidateType, setSelectedCandidateType] =
    useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [content, setContent] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [contentType, setContentType] = useState<ContentType>("opinion");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(createPost, initialState);

  const loadCandidates = useCallback(
    async (type: string, userCountry: string) => {
      setLoadingCandidates(true);
      try {
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
    },
    [],
  );

  // Cargar usuario actual al montar el componente
  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCandidateTypes();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCandidateType && currentUser && !preselectedCandidate) {
      loadCandidates(selectedCandidateType, currentUser.pais);
    } else if (!selectedCandidateType) {
      setCandidates([]);
      if (!preselectedCandidate) {
        setSelectedCandidate("");
      }
    }
  }, [
    selectedCandidateType,
    currentUser,
    loadCandidates,
    preselectedCandidate,
  ]);

  useEffect(() => {
    if (preselectedCandidate && !selectedCandidateType) {
      setSelectedCandidateType(preselectedCandidate.tipo_candidatura);
      setSelectedCandidate(preselectedCandidate.id.toString());
    }
  }, [preselectedCandidate, selectedCandidateType]);

  // Manejar el resultado de la acción solo cuando cambia de false a true
  const prevSuccessRef = React.useRef(state.success);
  useEffect(() => {
    if (!prevSuccessRef.current && state.success) {
      // Limpiar formulario
      setContent("");
      if (!preselectedCandidate) {
        setSelectedCandidate("");
        setSelectedCandidateType("");
      }
      setContentType("opinion");
      removeImage();

      // Notificar al componente padre que se creó un post
      if (onPostCreated) {
        onPostCreated();
      }
    }
    prevSuccessRef.current = state.success;
  }, [state.success, onPostCreated, preselectedCandidate]);

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
      const response = await fetch(
        `/api/candidates/types?pais=${encodeURIComponent(currentUser.pais)}`,
      );
      const data = await response.json();
      setCandidateTypes(data);
    } catch (error) {
      console.error("Error loading candidate types:", error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleCandidateTypeChange = (value: string) => {
    setSelectedCandidateType(value);
    if (!preselectedCandidate) {
      setSelectedCandidate("");
    }
  };

  const handleCandidateChange = (value: string) => {
    setSelectedCandidate(value);
  };

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen debe ser menor a 5MB");
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen");
        return;
      }

      setSelectedImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Reset input file
    const fileInput = document.getElementById("post-image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // Agregar el ID del candidato seleccionado al FormData
    if (selectedCandidate) {
      formData.set("candidate-id", selectedCandidate);
    }

    // Agregar el tipo de contenido al FormData
    formData.set("content-type", contentType);

    if (selectedImage) {
      formData.set("post-image", selectedImage);
    }

    // Llamar a la acción del servidor
    await formAction(formData);
  };

  // Mostrar loading mientras se carga el usuario
  if (loadingUser) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si no hay usuario, mostrar mensaje
  if (!currentUser || isGuest) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Inicia sesión para crear publicaciones
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form action={handleSubmit}>
          <div className="flex space-x-3">
            <Avatar>
              <AvatarImage
                src={
                  currentUser.profile_image_url ||
                  "/placeholder.svg?height=40&width=40"
                }
              />
              <AvatarFallback>
                {currentUser.nombre.charAt(0)}
                {currentUser.apellido.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-3">
            {preselectedCandidate && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={
                        currentUser.profile_image_url ||
                        `/placeholder.svg?height=32&width=32&text=${
                          preselectedCandidate.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("") || "/placeholder.svg"
                        }`
                      }
                    />
                    <AvatarFallback className="text-xs">
                      {preselectedCandidate.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      📝 Escribiendo sobre: {preselectedCandidate.nombre}
                    </p>
                    <p className="text-xs text-green-700">
                      {preselectedCandidate.partido} •{" "}
                      {formatCountryName(preselectedCandidate.pais)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Textarea
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hecho, opinión o rumor... escribe acá"
              className="min-h-[100px] resize-none border-none shadow-none text-lg placeholder:text-gray-500"
              required
              maxLength={2000}
            />

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full h-auto max-h-64 rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="post-image"
              name="post-image"
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Selector de Tipo de Candidatura */}
              <Select
                value={selectedCandidateType}
                onValueChange={handleCandidateTypeChange}
                disabled={loadingTypes || !!preselectedCandidate}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingTypes
                        ? "Cargando tipos..."
                        : candidateTypes.length === 0
                          ? `No hay candidatos en ${formatCountryName(
                              currentUser.pais,
                            )}`
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

              {/* Selector de Candidato */}
              <Select
                value={
                  preselectedCandidate
                    ? preselectedCandidate.id.toString()
                    : selectedCandidate
                }
                onValueChange={handleCandidateChange}
                disabled={
                  !selectedCandidateType ||
                  loadingCandidates ||
                  !!preselectedCandidate
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedCandidateType
                        ? "Primero selecciona un tipo"
                        : loadingCandidates
                          ? "Cargando candidatos..."
                          : "Selecciona un candidato"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {candidates.length > 0 ? (
                    candidates.map(
                      (candidate) =>
                        candidate.finalized !== true && (
                          <SelectItem
                            key={candidate.id}
                            value={candidate.id.toString()}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {candidate.nombre}
                              </span>
                              <span className="text-sm hidden md:block text-gray-500">
                                ({candidate.partido})
                              </span>
                            </div>
                          </SelectItem>
                        ),
                    )
                  ) : selectedCandidateType && !loadingCandidates ? (
                    <SelectItem value="no-candidates" disabled>
                      No hay candidatos de este tipo en{" "}
                      {formatCountryName(currentUser.pais)}
                    </SelectItem>
                  ) : (
                    <SelectItem value="loading" disabled>
                      {loadingCandidates
                        ? "Cargando..."
                        : "Selecciona un tipo primero"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Información del candidato seleccionado */}
            {selectedCandidate && candidates.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                {(() => {
                  const candidate = candidates.find(
                    (c) => c.id.toString() === selectedCandidate,
                  );
                  if (!candidate) return null;
                  return (
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={`/placeholder.svg?height=32&width=32&text=${candidate.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}`}
                        />
                        <AvatarFallback className="text-xs">
                          {candidate.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          {candidate.nombre}
                        </p>
                        <p className="text-xs text-blue-700">
                          {candidate.partido} •{" "}
                          {formatCountryName(candidate.pais)} • Ranking #
                          {candidate.ranking}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Mostrar mensaje de estado */}
            {state?.message && (
              <div
                className={`text-sm p-3 rounded-lg border ${
                  state.success
                    ? "text-green-700 bg-green-50 border-green-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}
              >
                {state.message}
              </div>
            )}

            {/* Botones de tipo de contenido y contador de caracteres */}
            <div className="flex items-center justify-between">
              {/* Botones de tipo de contenido */}
              <div className="flex space-x-2">
                {(["hecho", "opinion", "rumor"] as ContentType[]).map(
                  (type) => {
                    const config = getContentTypeConfig(type);
                    const Icon = config.icon;
                    const isSelected = contentType === type;

                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleContentTypeChange(type)}
                        className={`
                        flex items-center space-x-1 transition-all duration-200
                        ${
                          isSelected
                            ? `${config.color} ${config.bgColor} ${config.borderColor} border-2`
                            : `text-gray-600 hover:${config.color} ${config.hoverColor}`
                        }
                      `}
                        title={config.description}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          {config.label}
                        </span>
                      </Button>
                    );
                  },
                )}
              </div>

              {/* Contador de caracteres */}
              <span
                className={`text-xs ${
                  content.length > 1800 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {content.length}/2000
              </span>
            </div>

            {/* Información del tipo de contenido seleccionado */}
            {contentType && (
              <div
                className={`p-2 rounded-lg border ${
                  getContentTypeConfig(contentType).bgColor
                } ${getContentTypeConfig(contentType).borderColor}`}
              >
                <div className="flex items-center space-x-2">
                  <span className={getContentTypeConfig(contentType).color}>
                    {React.createElement(
                      getContentTypeConfig(contentType).icon,
                      { className: "w-4 h-4" },
                    )}
                  </span>
                  <p
                    className={`text-xs ${
                      getContentTypeConfig(contentType).color
                    }`}
                  >
                    <strong>{getContentTypeConfig(contentType).label}:</strong>{" "}
                    {getContentTypeConfig(contentType).description}
                  </p>
                </div>
              </div>
            )}

            {/* honeypot */}
            <input
              type="text"
              name="website"
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="flex items-center justify-between pt-2">
              {/* <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById("post-image")?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Foto
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <Smile className="w-4 h-4 mr-2" />
                  Emoji
                </Button>
              </div> */}
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  !content.trim() ||
                  pending ||
                  content.length > 2000 ||
                  selectedCandidateType === "" ||
                  selectedCandidate === ""
                }
              >
                {pending ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
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

const getContentTypeConfig = (type: ContentType) => {
  const configs = {
    hecho: {
      label: "Hecho",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      hoverColor: "hover:bg-green-100",
      description: "Información verificable y objetiva",
    },
    opinion: {
      label: "Opinión",
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
      description: "Punto de vista personal o análisis",
    },
    rumor: {
      label: "Rumor",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      hoverColor: "hover:bg-orange-100",
      description: "Información no confirmada",
    },
  };
  return configs[type];
};
