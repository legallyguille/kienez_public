import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">¡Email Verificado!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de Decernit.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>

          <Button variant="outline" asChild className="w-full bg-transparent">
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
