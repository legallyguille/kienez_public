"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import React, { useEffect, useState, useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateVideoWithId } from "@/app/actions/videos";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { check } from "zod/v4";

const InitialState = {
  success: false,
  message: "",
};

type VideoProps = {
  id: number;
  title: string;
  summary: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  is_active: boolean;
  is_public: boolean;
};

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const videoId = Number.parseInt(resolvedParams.id);
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<VideoProps | null>(null);
  const boundUpdateVideoWithId = updateVideoWithId.bind(null, videoId);
  const [state, formAction, pending] = useActionState(boundUpdateVideoWithId, InitialState);
  const [activo, setActivo] = useState(video?.is_active || false);
  const [publico, setPublico] = useState(video?.is_public || false);

  useEffect(() => {
    // Simular carga de datos del video
    fetch(`/api/kvideos/${videoId}`)
      .then((response) => response.json())
      .then((data) => {
        setVideo(data.video);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading video:", error);
        setLoading(false);
      });
  }, [videoId]);

  console.log("Video data:", video?.title );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Video no encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/kvideos">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a videos
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Editar Video: {video.title}
            </CardTitle>
            <CardDescription>Actualiza los datos del video.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction}>
              <div className="mb-4">
                <Label htmlFor="title">Título:</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={video.title}
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="summary">Resumen:</Label>
                <Input
                  type="text"
                  id="summary"
                  name="summary"
                  defaultValue={video.summary}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="description">Descripción:</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  defaultValue={video.description}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="video_url">URL del Video:</Label>
                <Input
                  type="text"
                  id="video_url"
                  name="video_url"
                  defaultValue={video.video_url}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="thumbnail_url">URL de la Miniatura:</Label>
                <Input
                  type="text"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  defaultValue={video.thumbnail_url}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="duration_seconds">Duración (segundos):</Label>
                <Input
                  type="number"
                  id="duration_seconds"
                  name="duration_seconds"
                  defaultValue={video.duration_seconds}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-center space-x-2 pb-4">
                <Checkbox
                  id="is_active"
                  name="is_active"
                  defaultChecked={video.is_active}
                  onCheckedChange={(checked) => setActivo(checked === true)}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  name="is_public"
                  defaultChecked={video.is_public}
                  onCheckedChange={(checked) => setPublico(checked === true)}
                />
                <Label htmlFor="is_public">Público</Label>
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={pending}
                >
                  {pending ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Link href="/kvideos" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
