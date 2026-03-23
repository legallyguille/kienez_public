"use client"

import type React from "react"

import { useState } from "react"
import { Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Email enviado",
          description: "Revisa tu bandeja de entrada para el enlace de verificación",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Error enviando email de verificación",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Mail className="mx-auto h-16 w-16 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-blue-600">Verifica tu Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Te hemos enviado un enlace de verificación a tu email. Revisa tu bandeja de entrada y haz clic en el enlace
            para activar tu cuenta.
          </p>
        </div>

        <form onSubmit={handleResendVerification} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-blue-600">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Reenviar Email de Verificación"
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No recibiste el email? Revisa tu carpeta de spam o solicita un nuevo enlace arriba.
          </p>
        </div>
      </div>
    </div>
  )
}
