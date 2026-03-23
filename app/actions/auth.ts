"use server"

import { getPool } from "@/lib/db"
import { hashPassword, isValidEmail, isValidAlias, verifyPassword } from "@/lib/auth"
import { createSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { sendVerificationEmail, generateVerificationToken, changeVerificationToken, sendPassResetEmail } from "@/lib/mailjet"

interface RegisterFormData {
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: string
  pais: string
  alias: string
  email: string
  datosOcultos: boolean
  password: string
  confirmPassword: string
}

interface LoginFormData {
  emailOrAlias: string
  password: string
}

async function verifyRecaptcha(token: string, action: string, remoteIp?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY!
  const params = new URLSearchParams({
    secret,
    response: token,
    ...(remoteIp ? { remoteip: remoteIp } : {}),
  })

  const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    // No caches
    cache: "no-store",
  })

  return (await resp.json()) as {
    success: boolean
    score?: number
    action?: string
    challenge_ts?: string
    hostname?: string
    "error-codes"?: string[]
  }
}

export async function registerUser(prevState: any, formData: FormData) {
  // 1) Verificar reCAPTCHA primero
  const recaptchaToken = formData.get("recaptchaToken") as string | null
  const recaptchaAction = (formData.get("recaptchaAction") as string | null) ?? "register"

  if (!recaptchaToken) {
    return { success: false, message: "No se pudo validar reCAPTCHA." }
  }

  //reCAPTCHA verification
  try {
    const result = await verifyRecaptcha(recaptchaToken, recaptchaAction)
    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5")

    if (!result.success) {
      return {
        success: false,
        message: "Fallo en verificación de reCAPTCHA.",
      }
    }

    if (result.action !== recaptchaAction) {
      return {
        success: false,
        message: "Acción de reCAPTCHA inválida.",
      }
    }

    if ((result.score ?? 0) < minScore) {
      return {
        success: false,
        message: "Puntuación de reCAPTCHA muy baja. Intenta nuevamente.",
      }
    }
    // console.log("reCAPTCHA", {
    //   success: result.success,
    //   score: result.score,
    //   action: result.action,
    //   hostname: result.hostname,
    //   errors: result["error-codes"] ?? [],
    // })
  } catch (e: any) {
    console.error("Error verificando reCAPTCHA:", e)
    return { success: false, message: "Error verificando reCAPTCHA." }
  }

  //honeypot check
  try {
    const websiteField = formData.get("website")

    if (websiteField) {
      // Campo honeypot llenado, posible bot
      return {
        success: false,
        message: "Bot detected. Submission rejected.",
      }
    }
  } catch (e: any) {
    console.error("Error verificando campo honeypot:", e)
    return { success: false, message: "Error procesando formulario." }
  }

  // BLOCK TEMP EMAIL DOMAINS
  try {
    const email = formData.get("email") as string
    if (await isDisposableEmail(email)) {
      return {
        success: false,
        message: "No se permiten dominios de email temporales.",
      }
    }
  } catch (e: any) {
    console.error("Error verificando dominios de email:", e)
    return { success: false, message: "Error procesando formulario." }
  }

  // 2) Extraer y validar datos de usuario
  try {
    const userData: RegisterFormData = {
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      fechaNacimiento: formData.get("fecha-nacimiento") as string,
      sexo: formData.get("sexo") as string,
      pais: formData.get("pais") as string,
      alias: formData.get("alias") as string,
      email: formData.get("email") as string,
      datosOcultos: formData.get("datos-ocultos") === "on",
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirm-password") as string,
    }

    if (!userData.nombre || !userData.apellido || !userData.email || !userData.alias || !userData.password) {
      return { success: false, message: "Todos los campos obligatorios deben ser completados." }
    }
    if (!isValidEmail(userData.email)) {
      return { success: false, message: "El formato del email no es válido." }
    }
    if (!isValidAlias(userData.alias)) {
      return {
        success: false,
        message: "El alias debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos.",
      }
    }
    if (userData.password !== userData.confirmPassword) {
      return { success: false, message: "Las contraseñas no coinciden." }
    }
    if (userData.password.length < 6) {
      return { success: false, message: "La contraseña debe tener al menos 6 caracteres." }
    }

    // 3) Verificar existencia
    const sql = await getPool()
    const existingUserResult = await sql.query("SELECT id FROM users WHERE email = $1 OR alias = $2", [
      userData.email,
      userData.alias,
    ])
    if (existingUserResult.rows.length > 0) {
      return { success: false, message: "El email o alias ya están registrados." }
    }

    // 4) Insertar usuario
    let userId: number
    try {
      const hashedPassword = await hashPassword(userData.password)
      const insertQuery = `
        INSERT INTO users (
          nombre, apellido, fecha_nacimiento, sexo, pais, 
          alias, email, datos_ocultos, password_hash, email_verified
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING id, nombre, apellido, alias, email
      `
      const insertValues = [
        userData.nombre,
        userData.apellido,
        userData.fechaNacimiento,
        userData.sexo,
        userData.pais,
        userData.alias,
        userData.email,
        userData.datosOcultos,
        hashedPassword,
        false, // email_verified starts as false
      ]
      const result = await sql.query(insertQuery, insertValues)
      userId = result.rows[0].id

      const verificationToken = await generateVerificationToken(userId)
      const emailSent = await sendVerificationEmail(userData.email, verificationToken)
      
      if (!emailSent) {
        console.error("Failed to send verification email")
        // Don't fail registration if email fails, just log it
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      return { success: false, message: "Error interno del servidor. Por favor, intenta de nuevo." }
    }

  } catch (error) {
    console.error("Error al registrar usuario:", error)
    return { success: false, message: "Error interno del servidor. Por favor, intenta de nuevo." }
  }
  redirect("/auth/verify-email")
}

export async function isDisposableEmail(email : string) {
  const domain = email.split("@")[1];
  //console.log("Verifying email domain for disposability:", domain);
  const response = await fetch(`https://open.kickbox.com/v1/disposable/${domain}`);
  const data = await response.json();
  console.log("Disposable email check result:", data.disposable);
  return data.disposable;
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const loginData: LoginFormData = {
      emailOrAlias: formData.get("email-alias") as string,
      password: formData.get("password") as string,
    }

    // Validaciones básicas
    if (!loginData.emailOrAlias || !loginData.password) {
      return {
        success: false,
        message: "Email/alias y contraseña son requeridos.",
      }
    }

    // Buscar usuario por email o alias
    const sql = await getPool()
    const userQuery = `
      SELECT id, nombre, apellido, alias, email, pais, datos_ocultos, password_hash, role, email_verified, active
      FROM users 
      WHERE email = $1 OR alias = $1
    `
    const userResult = await sql.query(userQuery, [loginData.emailOrAlias])

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: "Credenciales incorrectas.",
      }
    }

    const user = userResult.rows[0]

    if (!user.email_verified) {
      return {
        success: false,
        message: "Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
        needsVerification: true,
        email: user.email,
      }
    }

    if( !user.active ) {
      return {
        success: false,
        message: "Tu cuenta ha sido desactivada. Contacta al soporte para más información.",
      }
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(loginData.password, user.password_hash)

    if (!isValidPassword) {
      return {
        success: false,
        message: "Credenciales incorrectas.",
      }
    }

    // Crear sesión
    await createSession({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      alias: user.alias,
      email: user.email,
      pais: user.pais,
      datos_ocultos: user.datos_ocultos,
      role: user.role,
      active: user.active ?? true,
    })

    //console.log("Usuario logueado exitosamente:", user.alias)
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }

  // Redirigir al dashboard/home después del login exitoso
  redirect("/")
}

export async function sendPasswordResetEmail(prevState: any, formData: FormData) {
  //console.log("sendPasswordResetEmail action called", formData)
  const email = formData.get("email") as string
  const emailSite = formData.get("emailSite") as string

  //honeypot check
  try {
    const emailSiteField = formData.get("emailSite")

    if (emailSiteField) {
      // Campo honeypot llenado, posible bot
      return {
        success: false,
        message: "Bot detected. Submission rejected.",
      }
    }
  } catch (e: any) {
    console.error("Error verificando campo honeypot:", e)
    return { success: false, message: "Error procesando formulario." }
  }

  if (!email || !isValidEmail(email)) {
    return { success: false, message: "Por favor ingresa un correo electrónico válido." }
  }

  try {
    const sql = await getPool()
    const userResult = await sql.query("SELECT id FROM users WHERE email = $1", [email])

    if (userResult.rows.length === 0) {
      return { success: false, message: "El correo no existe en nuestro sistema." }
    }

    const userId = userResult.rows[0].id
    const resetToken = await changeVerificationToken(userId)

    // Aquí deberías enviar el correo con el token de restablecimiento
    const emailSent = await sendPassResetEmail(email, resetToken)
    // await sendPasswordResetEmailFunction(email, resetToken)

    //console.log(`Password reset token for user ${userId}: ${resetToken}`)

    return { success: true, message: "Revisa tu correo electrónico para restablecer tu contraseña." }

  } catch (error) {
    console.error("Error al enviar correo de restablecimiento de contraseña:", error)
    return { success: false, message: "Error interno del servidor. Por favor, intenta de nuevo." }
  }
}

// export async function resetPassword(prevState: any, formData: FormData) {
//   console.log("resetPassword action called", formData)
//   console.log("prevState:", prevState)

//   const token = formData.get("token") as string
//   const newPassword = formData.get("new-password") as string
//   const confirmPassword = formData.get("confirm-new-password") as string

//   if (!token || !newPassword) {
//     return { success: false, message: "Token y nueva contraseña son requeridos." }
//   }

//   if( newPassword !== confirmPassword ) {
//     return { success: false, message: "Las contraseñas no coinciden." }
//   }

//   if (newPassword.length < 6) {
//     return { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres." }
//   }

//   try {
//     const sql = await getPool()
//     const tokenResult = await sql.query(
//       `SELECT id, verification_token_expires FROM users 
//        WHERE token = $1 AND expires_at > NOW()`,
//       [token],
//     )

//     if (tokenResult.rows.length === 0) {
//       return { success: false, message: "Token inválido o expirado." }
//     }

//     const userId = tokenResult.rows[0].user_id
//     const hashedPassword = await hashPassword(newPassword)

//     await sql.query(
//       `UPDATE users SET password_hash = $1 WHERE id = $2`,
//       [hashedPassword, userId],
//     )

//     // await sql.query(
//     //   `DELETE FROM password_reset_tokens WHERE token = $1`,
//     //   [token],
//     // )

//   } catch (error) {
//     console.error("Error al restablecer la contraseña:", error)
//     return { success: false, message: "Error interno del servidor. Por favor, intenta de nuevo." }
//   }

//   return { success: true, message: "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña." }
// }

export async function logoutUser() {
  const { destroySession } = await import("@/lib/session")
  await destroySession()
  redirect("/login")
}
