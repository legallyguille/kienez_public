export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const sql = await getPool();
        const videos = await sql.query(`
            SELECT id, title, summary, thumbnail_url, duration_seconds
            FROM videos
            ORDER BY id ASC
        `);
        return NextResponse.json({ videos: videos.rows });
    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.error();
    }
}