export const runtime = "nodejs"
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getPool } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()
    const reportId = Number.parseInt(params.id)

    if (!status || !["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const pool = await getPool()

    await pool.query(
      `
      UPDATE reports 
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [status, user.id, reportId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
