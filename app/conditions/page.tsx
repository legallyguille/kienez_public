import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Volver a Kienez</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Condiciones de Uso</CardTitle>
            <p className="text-center text-gray-600">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Alcance y Aplicación</h2>
                <p className="text-gray-700 leading-relaxed">
                  Estas Condiciones de Uso se aplican a todos los usuarios de Kienez y complementan nuestros Términos de
                  Servicio. Al utilizar nuestra plataforma, usted acepta cumplir con estas condiciones.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Elegibilidad</h2>
                <p className="text-gray-700 leading-relaxed mb-3">Para usar Kienez, usted debe:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Tener al menos 18 años de edad</li>
                  <li>Tener capacidad legal para celebrar contratos</li>
                  <li>No estar prohibido de usar el servicio bajo las leyes aplicables</li>
                  <li>Proporcionar información veraz y precisa</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Normas de Conducta</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Los usuarios deben mantener un comportamiento respetuoso y constructivo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Respeto mutuo:</strong> Tratar a otros usuarios con cortesía y respeto
                  </li>
                  <li>
                    <strong>Debate constructivo:</strong> Participar en discusiones políticas de manera civilizada
                  </li>
                  <li>
                    <strong>Veracidad:</strong> No difundir información falsa o engañosa
                  </li>
                  <li>
                    <strong>No discriminación:</strong> Evitar contenido discriminatorio por raza, género, religión,
                    etc.
                  </li>
                  <li>
                    <strong>Privacidad:</strong> Respetar la privacidad de otros usuarios
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Contenido Prohibido</h2>
                <p className="text-gray-700 leading-relaxed mb-3">Está estrictamente prohibido publicar:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Contenido que incite a la violencia o al odio</li>
                  <li>Información personal de terceros sin consentimiento</li>
                  <li>Material con derechos de autor sin autorización</li>
                  <li>Spam, publicidad no autorizada o contenido comercial</li>
                  <li>Contenido pornográfico o sexualmente explícito</li>
                  <li>Amenazas, acoso o intimidación</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Sistema de Moderación</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Kienez emplea un sistema de moderación que incluye:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Moderación automática:</strong> Filtros de IA para detectar contenido inapropiado
                  </li>
                  <li>
                    <strong>Reportes de usuarios:</strong> Sistema para reportar contenido problemático
                  </li>
                  <li>
                    <strong>Revisión manual:</strong> Moderadores humanos para casos complejos
                  </li>
                  <li>
                    <strong>Medidas correctivas:</strong> Advertencias, suspensiones o eliminación de cuentas
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Derechos de Propiedad Intelectual</h2>
                <p className="text-gray-700 leading-relaxed">
                  Kienez respeta los derechos de propiedad intelectual. Los usuarios deben asegurarse de tener los
                  derechos necesarios sobre el contenido que publican. Respondemos a notificaciones válidas de
                  infracción de derechos de autor.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Uso de Datos y Análisis</h2>
                <p className="text-gray-700 leading-relaxed">
                  Kienez utiliza análisis de IA para proporcionar insights sobre candidatos políticos. Los usuarios
                  entienden que su actividad pública en la plataforma puede ser analizada para generar estadísticas y
                  tendencias agregadas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Disponibilidad del Servicio</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nos esforzamos por mantener Kienez disponible 24/7, pero no garantizamos un tiempo de actividad del
                  100%. Podemos realizar mantenimiento programado o enfrentar interrupciones técnicas ocasionales.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Terminación de Cuenta</h2>
                <p className="text-gray-700 leading-relaxed mb-3">Podemos suspender o terminar cuentas por:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Violación de estas condiciones o nuestros términos</li>
                  <li>Actividad fraudulenta o maliciosa</li>
                  <li>Solicitud del usuario</li>
                  <li>Inactividad prolongada</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Actualizaciones y Modificaciones</h2>
                <p className="text-gray-700 leading-relaxed">
                  Estas condiciones pueden ser actualizadas periódicamente para reflejar cambios en nuestros servicios o
                  requisitos legales. Los usuarios serán notificados de cambios significativos.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
