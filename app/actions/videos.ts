"use server";

import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation"

export async function createVideoWithId(
  prevState: any,
  formData: FormData
) {
  try {
    const currentUser = await getCurrentUser();
    if(!currentUser || currentUser.role !== 'admin') {
      redirect('/kvideos');
    }

    const videoData = {
      title: formData.get("title") as string,
      summary: formData.get("summary") as string,
      description: formData.get("description") as string,
      video_url: formData.get("video_url") as string,
      thumbnail_url: formData.get("thumbnail_url") as string,
      duration_seconds: Number(formData.get("duration_seconds")),
      is_active: formData.get("is_active") === "on",
      is_public: formData.get("is_public") === "on",
    };

    const sql = await getPool();
    const result = await sql.query(
      `INSERT INTO videos (
        title, summary, description, video_url, thumbnail_url, duration_seconds, is_active, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        videoData.title,
        videoData.summary,
        videoData.description,
        videoData.video_url,
        videoData.thumbnail_url,
        videoData.duration_seconds,
        videoData.is_active,
        videoData.is_public
      ]
    );

    if(result.rows.length === 0) {
      return {
        success: false,
        message: "Error al crear el video.",
      };
    }

    return {
      success: true,
      message: "Video creado correctamente.",
    };
  } catch (error) {
    console.error("Error al crear el video:", error);
    return {
      success: false,
      message: "Error al crear el video.",
    };
  }
}

export async function updateVideoWithId(
  videoId: number,
  prevState: any,
  formData: FormData
) {
    try {
        const currentUser = await getCurrentUser();
        if(!currentUser || currentUser.role !== 'admin') {
            redirect('/kvideos');
    }

    const videoData = {
        title: formData.get("title") as string,
        summary: formData.get("summary") as string,
        description: formData.get("description") as string,
        video_url: formData.get("video_url") as string,
        thumbnail_url: formData.get("thumbnail_url") as string,
        duration_seconds: Number(formData.get("duration_seconds")),
        is_active: formData.get("is_active") === "on",
        is_public: formData.get("is_public") === "on",
    };

    const sql = await getPool();
    const existingVideoResult = await sql.query(
        "SELECT id FROM videos WHERE id = $1",
        [videoId]
    );
    const existingVideo = existingVideoResult.rows;

    if(existingVideo.length === 0) {
        return {
            success: false,
            message: "El video no existe.",
        };
    }

    const result = await sql.query(
        `UPDATE videos SET 
            title = $1,
            summary = $2,
            description = $3,
            video_url = $4,
            thumbnail_url = $5,
            duration_seconds = $6,
            is_active = $7,
            is_public = $8
        WHERE id = $9`,
        [
            videoData.title,
            videoData.summary,
            videoData.description,
            videoData.video_url,
            videoData.thumbnail_url,
            videoData.duration_seconds,
            videoData.is_active,
            videoData.is_public,
            videoId
        ]
    );

    if(result.rows.length === 0) {
        return {
            success: false,
            message: "Error al actualizar el video.",
        };
    }

    return {
        success: true,
        message: "Video actualizado correctamente.",
    };
  } catch (error) {
    console.error("Error al actualizar el video:", error);
    return {
      success: false,
      message: "Error al actualizar el video.",
    };
  }
}