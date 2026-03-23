import { type NextRequest, NextResponse } from "next/server"
import { verifyEmailToken, sendWelcomeEmail } from "@/lib/mailjet"
import { getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token de verificación requerido" }, { status: 400 })
    }

    const result = await verifyEmailToken(token)
    //console.log("Resultado de verificación de email:", result.userId)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    //const { getPool } = await import("@/lib/db")
    const pool = await getPool()
    const userResult = await pool.query("SELECT nombre, apellido, email FROM users WHERE id = $1", [result.userId])

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0]
      await sendWelcomeEmail({
        to: user.email,
        name: `${user.nombre} ${user.apellido}`,
      })
    }

    // Redirigir a página de éxito
    return NextResponse.redirect(new URL("/auth/email-verified", request.url))
  } catch (error) {
    console.error("Error verificando email:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
