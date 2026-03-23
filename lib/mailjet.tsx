import { getPool } from "@/lib/db"
import crypto from "crypto"

// Configuración de Mailjet
const MAILJET_API_KEY = process.env.MAILJET_API_KEY!
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY!
const FROM_EMAIL = process.env.FROM_EMAIL!

interface MailjetResponse {
  Messages: Array<{
    Status: string
    CustomID: string
    To: Array<{
      Email: string
      MessageUUID: string
      MessageID: number
      MessageHref: string
    }>
    Cc: Array<any>
    Bcc: Array<any>
  }>
}

class MailjetService {
  private apiKey: string
  private secretKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = MAILJET_API_KEY
    this.secretKey = MAILJET_SECRET_KEY
    this.fromEmail = FROM_EMAIL
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString("base64")
    return `Basic ${credentials}`
  }

  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Messages: [
            {
              From: {
                Email: this.fromEmail,
                Name: "Kienez",
              },
              To: [
                {
                  Email: to,
                },
              ],
              Subject: subject,
              TextPart: textContent || subject,
              HTMLPart: htmlContent,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Mailjet API error:", errorText)
        return false
      }

      const result: MailjetResponse = await response.json()
      //console.log("Email sent successfully:", result)
      return true
    } catch (error) {
      console.error("Error sending email:", error)
      return false
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

    const subject = "Verifica tu cuenta en Kienez"
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Le damos la bienvenida a Kienez!</h2>
        <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro, necesitas verificar tu dirección de correo electrónico.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verificar mi cuenta
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este correo.
        </p>
      </div>
    `

    const textContent = `
      ¡Bienvenido a Kienez!
      
      Gracias por registrarte. Para completar tu registro, verifica tu cuenta haciendo clic en este enlace:
      ${verificationUrl}
      
      Este enlace expirará en 24 horas.
    `

    return await this.sendEmail(email, subject, htmlContent, textContent)
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = "¡Le damos la bienvenida a Kienez!"
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Hola ${name}!</h2>
        <p>Tu cuenta ha sido verificada exitosamente. ¡Le damos la bienvenida a Kienez!</p>
        <p>Ya puedes acceder a todas las funcionalidades de nuestra plataforma:</p>
        <ul style="color: #666;">
          <li>Crear y compartir posts</li>
          <li>Seguir a otros usuarios</li>
          <li>Participar en discusiones</li>
          <li>Explorar contenido personalizado</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Iniciar Sesión
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          ¡Esperamos que disfrutes tu experiencia en Kienez!
        </p>
      </div>
    `

    const textContent = `
      ¡Hola ${name}!
      
      Tu cuenta ha sido verificada exitosamente. ¡Bienvenido a Kienez!
      
      Ya puedes iniciar sesión en: ${process.env.NEXT_PUBLIC_APP_URL}/login
      
      ¡Esperamos que disfrutes tu experiencia en Kienez!
    `

    return await this.sendEmail(to, subject, htmlContent, textContent)
  }

  async sendPassResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    const subject = "Restablecer contraseña en Kienez"
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Restablecer contraseña en Kienez!</h2>
        <p>Recibiste este correo porque solicitaste restablecer tu contraseña.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Restablecer mi contraseña
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este correo.
        </p>
      </div>
    `

    const textContent = `
      ¡Bienvenido nuevamente a Kienez!
    `

    return await this.sendEmail(email, subject, htmlContent, textContent)
  }
}

// Funciones de utilidad para la base de datos
export async function generateVerificationToken(userId: number): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

  const sql = await getPool()
  await sql.query(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at) 
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) 
     DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
    [userId, token, expiresAt],
  )

  return token
}

export async function changeVerificationToken(userId: number): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

  const sql = await getPool()
  await sql.query(
    `UPDATE users SET verification_token = $2, verification_token_expires = $3 WHERE id = $1`,
    [userId, token, expiresAt],
  )

  return token
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: number; message: string }> {
  const sql = await getPool()

  // Buscar el token
  const tokenResult = await sql.query(
    `SELECT user_id, expires_at FROM email_verification_tokens 
     WHERE token = $1 AND expires_at > NOW()`,
    [token],
  )

  if (tokenResult.rows.length === 0) {
    return { success: false, message: "Token inválido o expirado" }
  }

  const { user_id } = tokenResult.rows[0]

  // Marcar el email como verificado
  await sql.query(`UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1`, [user_id])

  // Eliminar el token usado
  await sql.query(`DELETE FROM email_verification_tokens WHERE token = $1`, [token])

  return { success: true, userId: user_id, message: "Email verificado exitosamente" }
}

export async function isEmailVerified(userId: number): Promise<boolean> {
  const sql = await getPool()
  const result = await sql.query(`SELECT email_verified FROM users WHERE id = $1`, [userId])

  return result.rows[0]?.email_verified || false
}

// Instancia singleton del servicio
const mailjetService = new MailjetService()

// Funciones wrapper para usar en otros archivos
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  return await mailjetService.sendVerificationEmail(email, token)
}

export async function sendWelcomeEmail(params: { to: string; name: string }): Promise<boolean> {
  return await mailjetService.sendWelcomeEmail(params.to, params.name)
}

export async function sendPassResetEmail(email: string, token: string): Promise<boolean> {
  return await mailjetService.sendPassResetEmail(email, token)
}

export { mailjetService }
