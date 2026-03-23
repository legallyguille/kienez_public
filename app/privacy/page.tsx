import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Volver a DECERNIT</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Política de Privacidad</CardTitle>
            <p className="text-center text-gray-600">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Recopilamos diferentes tipos de información para proporcionar y mejorar nuestros servicios:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Información de registro:</strong> Nombre, apellido, email, país y alias
                  </li>
                  <li>
                    <strong>Información de perfil:</strong> Foto de perfil y preferencias de privacidad
                  </li>
                  <li>
                    <strong>Contenido del usuario:</strong> Posts, comentarios y reacciones
                  </li>
                  <li>
                    <strong>Datos de uso:</strong> Páginas visitadas, tiempo de permanencia y patrones de navegación
                  </li>
                  <li>
                    <strong>Información técnica:</strong> Dirección IP, tipo de navegador y dispositivo
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Cómo Utilizamos su Información</h2>
                <p className="text-gray-700 leading-relaxed mb-3">Utilizamos la información recopilada para:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Proporcionar y mantener nuestros servicios</li>
                  <li>Personalizar su experiencia en la plataforma</li>
                  <li>Enviar notificaciones y comunicaciones importantes</li>
                  <li>Analizar el uso de la plataforma para mejoras</li>
                  <li>Detectar y prevenir actividades fraudulentas</li>
                  <li>Cumplir con obligaciones legales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Compartir Información</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  No vendemos ni alquilamos su información personal. Podemos compartir información en las siguientes
                  circunstancias:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Con su consentimiento:</strong> Cuando nos autorice explícitamente
                  </li>
                  <li>
                    <strong>Proveedores de servicios:</strong> Con terceros que nos ayudan a operar la plataforma
                  </li>
                  <li>
                    <strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o autoridades
                  </li>
                  <li>
                    <strong>Protección de derechos:</strong> Para proteger nuestros derechos y los de otros usuarios
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Seguridad de los Datos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal
                  contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye encriptación de
                  datos, acceso restringido y monitoreo regular de nuestros sistemas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Retención de Datos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos
                  descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Sus Derechos</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Dependiendo de su ubicación, puede tener los siguientes derechos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Acceso:</strong> Solicitar una copia de su información personal
                  </li>
                  <li>
                    <strong>Rectificación:</strong> Corregir información inexacta o incompleta
                  </li>
                  <li>
                    <strong>Eliminación:</strong> Solicitar la eliminación de su información
                  </li>
                  <li>
                    <strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado
                  </li>
                  <li>
                    <strong>Oposición:</strong> Oponerse al procesamiento de sus datos
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Cookies y Tecnologías Similares</h2>
                <p className="text-gray-700 leading-relaxed">
                  Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el tráfico del sitio
                  y personalizar el contenido. Puede controlar el uso de cookies a través de la configuración de su
                  navegador.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Transferencias Internacionales</h2>
                <p className="text-gray-700 leading-relaxed">
                  Su información puede ser transferida y procesada en países diferentes al suyo. Nos aseguramos de que
                  dichas transferencias cumplan con las leyes de protección de datos aplicables.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Cambios a esta Política</h2>
                <p className="text-gray-700 leading-relaxed">
                  Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios
                  significativos publicando la nueva política en nuestro sitio web y actualizando la fecha de "última
                  actualización".
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contacto</h2>
                <p className="text-gray-700 leading-relaxed">
                  Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, puede contactarnos
                  a través de nuestros canales oficiales de soporte.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
