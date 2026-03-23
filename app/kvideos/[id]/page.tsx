"use client";

import VideoPlayer from "@/components/video-player";
import { useState, useEffect } from "react";
import React from "react";

type Video = {
  id: number;
  title: string;
  summary: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_active: boolean;
  is_public: boolean;
  view_count: number;
  likes_count: number;
  comments_count: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
  published_at: string;
};

export default function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const id = Number.parseInt(resolvedParams.id);

  if (isNaN(id)) {
    return <div>ID de video no válido.</div>;
  }

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    try {
      const response = await fetch(`/api/kvideos/${id}`);
      const data = await response.json();
      setVideo(data.video);
    } catch (error) {
      console.error("Error fetching video:", error);
    } finally {
      setLoading(false);
    }
  };

  //console.log("Video cargado:", video);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16 flex items-center justify-center">
        {loading ? (
          <p>Cargando video...</p>
        ) : (
          <div className="text-center max-w-xxl mx-auto p-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              {video?.title}
            </h1>
            <p className="text-gray-600 mb-4">{video?.description}</p>
            <div>
              {/* <video src={video?.video_url} controls controlsList="nodownload noplaybackrate disablePictureInPicture" /> */}
              <VideoPlayer src={video?.video_url || ""} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
