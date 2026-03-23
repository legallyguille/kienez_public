import "server-only"
import bcrypt from "bcryptjs"

// Función para hashear contraseñas
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Función para verificar contraseñas
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Función para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Función para validar alias (solo letras, números y guiones bajos)
export function isValidAlias(alias: string): boolean {
  const aliasRegex = /^[a-zA-Z0-9_]{3,20}$/
  return aliasRegex.test(alias)
}

export async function isDisposableEmail(email : string) {
  const domain = email.split("@")[1];
  //("Verifying email domain for disposability:", domain);
  const response = await fetch(`https://open.kickbox.com/v1/disposable/${domain}`);
  const data = await response.json();
  //console.log("Disposable email check result:", data.disposable);
  return data.disposable;
}