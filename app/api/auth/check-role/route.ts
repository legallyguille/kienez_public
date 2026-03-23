import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ role: null }, { status: 401 })
    }

    return NextResponse.json({ role: user.role })
  } catch (error) {
    console.error("Error checking user role:", error)
    return NextResponse.json({ role: null }, { status: 500 })
  }
}
