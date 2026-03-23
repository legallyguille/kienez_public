import { type NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/mailjet"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const pool = await getPool()

    // Buscar usuario no verificado
    const result = await pool.query(
      "SELECT id, nombre, apellido, email FROM users WHERE email = $1 AND email_verified = FALSE",
      [email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado o ya verificado" }, { status: 400 })
    }

    const user = result.rows[0]

    // Generar nuevo token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    // Actualizar token en la base de datos
    await pool.query(
      `UPDATE users 
       SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3`,
      [verificationToken, expiresAt, user.id],
    )

    // Enviar email de verificación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`

    const result2 = await sendVerificationEmail(user.email, verificationToken)

    if (!result2) {
      return NextResponse.json({ error: "Error enviando email de verificación" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Email de verificación enviado exitosamente",
    })
  } catch (error) {
    console.error("Error reenviando verificación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
