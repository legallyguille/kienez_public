import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Términos de Servicio</CardTitle>
            <p className="text-center text-gray-600">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Al acceder y utilizar Kienez, usted acepta estar sujeto a estos Términos de Servicio y todas las
                  leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, se le prohíbe
                  usar o acceder a este sitio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
                <p className="text-gray-700 leading-relaxed">
                  Kienez es una plataforma digital que permite a los usuarios seguir, analizar y comentar sobre
                  candidatos políticos y procesos electorales. Proporcionamos herramientas de análisis de contenido y
                  seguimiento de actividad política.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Registro y Cuenta de Usuario</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Para utilizar ciertas funciones de nuestro servicio, debe registrarse y crear una cuenta. Usted se
                  compromete a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Proporcionar información precisa y completa durante el registro</li>
                  <li>Mantener la seguridad de su contraseña</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                  <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Uso Aceptable</h2>
                <p className="text-gray-700 leading-relaxed mb-3">Al usar Kienez, usted acepta no:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Publicar contenido ofensivo, difamatorio o que incite al odio</li>
                  <li>Interferir con el funcionamiento del servicio</li>
                  <li>Intentar acceder a cuentas de otros usuarios</li>
                  <li>Usar el servicio para actividades ilegales</li>
                  <li>Spam o envío masivo de mensajes no solicitados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Contenido del Usuario</h2>
                <p className="text-gray-700 leading-relaxed">
                  Usted retiene los derechos sobre el contenido que publique en Kienez. Sin embargo, al publicar
                  contenido, nos otorga una licencia no exclusiva para usar, mostrar y distribuir dicho contenido en
                  relación con nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Privacidad</h2>
                <p className="text-gray-700 leading-relaxed">
                  Su privacidad es importante para nosotros. Consulte nuestra Política de Privacidad para obtener
                  información sobre cómo recopilamos, usamos y protegemos su información personal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Limitación de Responsabilidad</h2>
                <p className="text-gray-700 leading-relaxed">
                  Kienez se proporciona "tal como está" sin garantías de ningún tipo. No seremos responsables de daños
                  directos, indirectos, incidentales o consecuentes que resulten del uso de nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Modificaciones</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en
                  vigor inmediatamente después de su publicación en el sitio web.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Contacto</h2>
                <p className="text-gray-700 leading-relaxed">
                  Si tiene preguntas sobre estos Términos de Servicio, puede contactarnos a través de nuestros canales
                  oficiales de soporte.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
