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
import { createVideoWithId } from "@/app/actions/videos";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const InitialState = {
  success: false,
  message: "",
};

export default function CreateVideoPage() {
  const [state, formAction, pending] = useActionState(
    createVideoWithId,
    InitialState
  );

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
            <CardTitle className="text-2xl font-bold">Agregar Video:</CardTitle>
            <CardDescription>Ingresa los datos del video.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction}>
              <div className="mb-4">
                <Label htmlFor="title">Título:</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="mb-4">
                <Label htmlFor="summary">Resumen:</Label>
                <Input
                  type="text"
                  id="summary"
                  name="summary"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="description">Descripción:</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="video_url">URL del Video:</Label>
                <Input
                  type="text"
                  id="video_url"
                  name="video_url"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="thumbnail_url">URL de la Miniatura:</Label>
                <Input
                  type="text"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="duration_seconds">Duración (segundos):</Label>
                <Input
                  type="number"
                  id="duration_seconds"
                  name="duration_seconds"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-center space-x-2 pb-4">
                <Checkbox id="is_active" name="is_active" defaultChecked />
                <Label htmlFor="is_active">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="is_public" name="is_public" defaultChecked />
                <Label htmlFor="is_public">Público</Label>
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={pending}
                >
                  {pending ? "Agregando..." : "Agregar video"}
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
