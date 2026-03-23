"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { loginUser } from "@/app/actions/auth"
import { Suspense } from "react"

const initialState = {
  success: false,
  message: "",
}

function LoginContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const [state, formAction, pending] = useActionState(loginUser, initialState)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">Iniciar Sesión</CardTitle>
          <CardDescription>Accede a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</div>}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-alias">Correo o Alias</Label>
              <Input id="email-alias" name="email-alias" placeholder="tu@email.com o tu_alias" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="Tu contraseña" required />
            </div>

            {state?.message && (
              <div className={`text-center text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
                {state.message}
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800" disabled={pending}>
              {pending ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="text-center text-sm border-t pt-4">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Crear cuenta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  )
}
