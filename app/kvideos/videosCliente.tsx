"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/header/kienez-logo.png";

type Videos = {
  id: number;
  title: string;
  description: string;
  summary: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  is_active: boolean;
  is_public: boolean;
};

type Props = {
  isGuest: boolean;
  user: { id: number; nombre: string; role: string } | null;
};

export default function VideosClient({ isGuest, user }: Props) {
  const [videos, setVideos] = useState<Videos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kvideos")
      .then((res) => res.json())
      .then((data) => setVideos(data.videos))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            <Image src={Logo} alt="Kienez" width={150} height={60} />
          </Link>

          {isGuest ? (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                  Registrarse
                </Button>
              </Link>
            </div>
          ) : (
            <span className="text-sm text-gray-600">Hola, {user?.nombre}</span>
          )}
        </div>
      </header>

      {/* CONTENIDO */}

      <div className="flex pt-16 mx-auto max-w-7xl">
        <div className="m-4 flex justify-start flex-1">
          <p className="text-2xl font-bold text-blue-600 text-center self-center">
            Contenido
          </p>
        </div>
        {user && user.role === "admin" && (
          <div className="flex justify-end">
            <Link href="/kvideos/create">
              <Button className="m-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                Crear Nuevo Video
              </Button>
            </Link>
          </div>
        )}
      </div>
      <div className="pt-10 flex items-center justify-center">
        {loading ? (
          <p>Cargando videos…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id}>
                <Link href={`/kvideos/${video.id}`}>
                  <div className="bg-white p-4 rounded shadow">
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      width={300}
                      height={200}
                    />
                    <h2 className="font-semibold">{video.title}</h2>
                    <p className="text-sm text-gray-600">{video.summary}</p>

                    {/* {isGuest && (
                    <p className="text-xs text-red-500 mt-2">
                      Inicia sesión para comentar 👍
                    </p>
                  )} */}
                  </div>
                </Link>
                {user && user.role === "admin" && (
                  <Link href={`/kvideos/edit/${video.id}`}>
                    <Button className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                      Editar
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
