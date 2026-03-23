export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }>}) {
    const { id } = await params;
    try {
        const sql = await getPool();
        const video = await sql.query(`
            SELECT id, title, summary, description, video_url, thumbnail_url, is_active, is_public, views_count, likes_count, comments_count, duration_seconds, created_at, updated_at, published_at
            FROM videos
            WHERE id = ${id}
        `);
        return NextResponse.json({ video: video.rows[0] });
    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.error();
    }
}