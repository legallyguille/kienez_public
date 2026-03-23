"use server"

import { getPool } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { hashPassword, isValidEmail, isValidAlias, isDisposableEmail } from "@/lib/auth"
import { redirect } from "next/navigation"
import { generateVerificationToken, sendVerificationEmail } from "@/lib/mailjet"
import crypto from "crypto"
import { cookies } from 'next/headers'

interface UpdateProfileData {
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: string
  pais: string
  alias: string
  email: string
  datosOcultos: boolean
  password?: string
  confirmPassword?: string
  profileImage?: File
}

async function convertImageToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString("base64")
  return `data:${file.type};base64,${base64}`
}

export async function updateProfile(prevState: any, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      redirect("/login")
    }

    const profileImageFile = formData.get("profile-image") as File

    const profileData: UpdateProfileData = {
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
      profileImage: profileImageFile && profileImageFile.size > 0 ? profileImageFile : undefined,
    }

    if (!profileData.nombre || !profileData.apellido || !profileData.email || !profileData.alias) {
      return {
        success: false,
        message: "Todos los campos obligatorios deben ser completados.",
      }
    }

    if (!isValidEmail(profileData.email)) {
      return {
        success: false,
        message: "El formato del email no es válido.",
      }
    }

    if (!isValidAlias(profileData.alias)) {
      return {
        success: false,
        message: "El alias debe tener entre 3-20 caracteres y solo contener letras, números y guiones bajos.",
      }
    }

    const sql = await getPool()
    const existingUser = await sql.query(`
      SELECT id FROM users
      WHERE (email = $1 OR alias = $2)
      AND id != $3
    `, [profileData.email, profileData.alias, currentUser.id])

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        message: "El email o alias ya están registrados por otro usuario.",
      }
    }


    const oldEmail = await sql.query(`
        SELECT email FROM users
        WHERE id = $1
      `, [currentUser.id])

     let shouldLogout = false
    if (oldEmail.rows[0].email !== profileData.email) {
      await checkEmail(oldEmail.rows[0].email, profileData.email, sql, currentUser)
      shouldLogout = true
    }

    let hashedPassword = null
    if (profileData.password && profileData.password.trim() !== "") {
      if (profileData.password !== profileData.confirmPassword) {
        return {
          success: false,
          message: "Las contraseñas no coinciden.",
        }
      }

      if (profileData.password.length < 6) {
        return {
          success: false,
          message: "La contraseña debe tener al menos 6 caracteres.",
        }
      }

      hashedPassword = await hashPassword(profileData.password)
    }

    let profileImageId = null
    if (profileData.profileImage) {
      if (profileData.profileImage.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen debe ser menor a 5MB.",
        }
      }

      if (!profileData.profileImage.type.startsWith("image/")) {
        return {
          success: false,
          message: "Solo se permiten archivos de imagen.",
        }
      }

      const imageData = await convertImageToBase64(profileData.profileImage)

      // Insertar imagen en tabla profile_images
      const imageResult = await sql.query(`
        INSERT INTO profile_images (user_id, image_data, file_name, file_size, mime_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [currentUser.id, imageData, profileData.profileImage.name, profileData.profileImage.size, profileData.profileImage.type])

      profileImageId = imageResult.rows[0].id
    }

    if (hashedPassword && profileImageId) {
      await sql.query(`
        UPDATE users SET
          nombre = $1,
          apellido = $2,
          fecha_nacimiento = $3,
          sexo = $4,
          pais = $5,
          alias = $6,
          email = $7,
          datos_ocultos = $8,
          password_hash = $9,
          profile_image_id = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
      `, [profileData.nombre, profileData.apellido, profileData.fechaNacimiento, profileData.sexo, profileData.pais, profileData.alias, profileData.email, profileData.datosOcultos, hashedPassword, profileImageId, currentUser.id]
      )
    } else if (hashedPassword) {
      await sql.query(`
      UPDATE users SET
        nombre = $1,
        apellido = $2,
        fecha_nacimiento = $3,
        sexo = $4,
        pais = $5,
        alias = $6,
        email = $7,
        datos_ocultos = $8,
        password_hash = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `, [profileData.nombre, profileData.apellido, profileData.fechaNacimiento, profileData.sexo, profileData.pais, profileData.alias, profileData.email, profileData.datosOcultos, hashedPassword, currentUser.id]
      )
    } else if (profileImageId) {
      await sql.query(`
      UPDATE users SET
        nombre = $1,
        apellido = $2,
        fecha_nacimiento = $3,
        sexo = $4,
        pais = $5,
        alias = $6,
        email = $7,
        datos_ocultos = $8,
        profile_image_id = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `, [profileData.nombre, profileData.apellido, profileData.fechaNacimiento, profileData.sexo, profileData.pais, profileData.alias, profileData.email, profileData.datosOcultos, profileImageId, currentUser.id]
      )
    } else {
      await sql.query(`
      UPDATE users SET
        nombre = $1,
        apellido = $2,
        fecha_nacimiento = $3,
        sexo = $4,
        pais = $5,
        alias = $6,
        email = $7,
        datos_ocultos = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `, [profileData.nombre, profileData.apellido, profileData.fechaNacimiento, profileData.sexo, profileData.pais, profileData.alias, profileData.email, profileData.datosOcultos, currentUser.id]
      )
    }

    return {
      success: true,
      message: "Perfil actualizado exitosamente.",
      shouldLogout: shouldLogout,
    }
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

async function checkEmail(oldEmail: string, newEmail: string, sql: any, currentUser: any) {
  // BLOCK TEMP EMAIL DOMAINS
  try {
    if (await isDisposableEmail(newEmail)) {
      return {
        success: false,
        message: "No se permiten dominios de email temporales.",
      }
    }
  } catch (e: any) {
    console.error("Error verificando dominios de email:", e)
    return { success: false, message: "Error procesando formulario." }
  }
  //verificación de cambio de email
  try {
    if (oldEmail !== newEmail) {
      // console.log("El usuario ha cambiado su email. Se requiere verificación.")
      await sql.query(`
          UPDATE users SET
            email_verified = false,
            verification_token = default,
            verification_token_expires = default,
            email_verified_at = null
          WHERE id = $1
        `, [currentUser.id])

      // Generar nuevo token de verificación
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

      // Actualizar token en la base de datos
      await sql.query(
        `UPDATE users 
            SET verification_token = $1, verification_token_expires = $2
            WHERE id = $3`,
        [token, expiresAt, currentUser.id],
      )

      const verificationToken = await generateVerificationToken(currentUser.id)
      const emailSent = await sendVerificationEmail(newEmail, verificationToken)
    }
  } catch (error) {
    console.error("Error al verificar cambio de email:", error)
    return {
      success: false,
      message: "Error interno del servidor. Por favor, intenta de nuevo.",
    }
  }
}

export async function logout() {
  // Eliminar la cookie de sesión
  ;(await cookies()).delete('session')
  
  // Redirigir al login
  redirect('/login')
}

