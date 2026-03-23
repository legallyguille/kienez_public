export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import { interactWithPost } from "@/app/actions/posts"

export async function POST(request: Request, { params }: { params: Promise <{ id: string }> }) {
  try {
    const resolvedParams = await params
    const postId = Number.parseInt(resolvedParams.id)

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const { interactionType } = await request.json()

    if (!interactionType) {
      return NextResponse.json({ error: "Interaction type is required" }, { status: 400 })
    }

    const result = await interactWithPost(postId, interactionType)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in post interaction API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
