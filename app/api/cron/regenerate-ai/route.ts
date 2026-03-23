export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { regenerateCandidateProfile } from "@/lib/ai-regeneration";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  // console.log("Authorization Header:", authHeader);
  // console.log("Expected Header:", `Bearer ${process.env.CRON_SECRET}`);

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // console.log("⏱️ Cron iniciado");

  await regenerateCandidateProfile();

  return NextResponse.json({ ok: true });
}
