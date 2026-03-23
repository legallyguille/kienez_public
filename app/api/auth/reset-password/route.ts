import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { success } from "zod/v4";

export async function POST(request: NextRequest) {
    try {

        const { newPassword, confirmNewPassword, token, passwordSite } = await request.json()

        //honeypot check
        try {
            if (passwordSite && passwordSite.trim() !== "") {
                // Campo honeypot llenado, posible bot
                return NextResponse.json({ error: "Bot detected. Submission rejected." })
            }
        } catch (e: any) {
            console.error("Error verificando campo honeypot:", e)
            return NextResponse.json({ error: "Error procesando formulario." })
        }

        if (!newPassword) {
            return NextResponse.json({ success: false, message: "Contraseña requerida" }, { status: 400 })
        }

        if (!confirmNewPassword) {
            return NextResponse.json({ success: false, message: "Confirmar contraseña" }, { status: 400 })
        }

        if (newPassword !== confirmNewPassword) {
            return NextResponse.json({ success: false, message: "Las contraseñas no coinciden" }, { status: 400 })
        }

        const pool = await getPool()
        const tokenResult = await pool.query(
            `SELECT id, verification_token FROM users 
             WHERE verification_token = $1 AND verification_token_expires > NOW()`,
            [token],
        )

        if (tokenResult.rowCount === 0) {
            return NextResponse.json({ success: false, message: "Token inválido o expirado" }, { status: 400 })
        }

        const hashedPassword = await hashPassword(newPassword)

        const userId = tokenResult.rows[0].id

        // Aquí puedes actualizar la contraseña del usuario en la base de datos
        await pool.query(
            `UPDATE users SET password_hash = $1, verification_token = NULL, verification_token_expires = NULL 
             WHERE id = $2`,
            [hashedPassword, userId],
        )

        return NextResponse.json({ success: true, message: "Contraseña cambiada con éxito" }, { status: 200 })

    } catch (error) {
        console.error("Error al cambiar de contraseña:", error)
        return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
    }
}