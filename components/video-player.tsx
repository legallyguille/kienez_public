"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        preload: "auto",
        fluid: true,
      })
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  console.log("VideoPlayer:", videoRef);
  console.log("VideoPlayer instance:", playerRef);
  console.log("VideoPlayer src:", src);

  return (
    <video
      ref={videoRef}
      className="video-js vjs-default-skin"
      controlsList="nodownload"
      disablePictureInPicture
      // crossOrigin="anonymous"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
