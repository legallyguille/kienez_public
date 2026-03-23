import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Feed } from "@/components/feed";
import { getCurrentUser } from "@/lib/session";
import { isGuestUser } from "@/lib/session"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import GuestButton from "@/components/guest-button";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isGuest = await isGuestUser();

  console.log("guest: ", isGuest)

  // console.log('Hora actual del servidor:', new Date());
  // console.log('Timezone del servidor:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  // console.log('UTC offset:', new Date().getTimezoneOffset());

  // console.log('=== DEBUG HORARIOS ===');
  // console.log('Hora actual UTC:', new Date().toISOString());
  // console.log('Hora local del servidor:', new Date().toString());
  // console.log('Zona horaria del servidor:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  // console.log('Hora en Chile (ejemplo):',
  //   new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })
  // );

  // Si no hay usuario logueado, mostrar página de bienvenida
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Kienez te da la bienvenida
            </h1>
            <p className="text-gray-600 mb-4">
              Una red social para informarnos sobre candidaturas políticas y
              conectar con la ciudadanía.
            </p>
            {/* <h3 className="text-lg text-blue-700 font-semibold mb-4">***Ten en cuenta que aún es una plataforma en desarrollo***</h3> */}
            <div className="space-y-4">
              <Link href="/register" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800">
                  Crear Cuenta
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Iniciar Sesión
                </Button>
              </Link>
              <GuestButton />
            </div>
          </div>
        </div>
        <div>
          <Link href="/kvideos">
            <Button
              variant="link"
              className="fixed bottom-4 right-4 text-gray-100 hover:text-gray-300"
            >
              Sorpresa
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Página principal para usuarios autenticados
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="sm:flex sm:flex-col lg:flex lg:flex-row max-w-7xl mx-auto pt-16">
        <Sidebar isGuest={isGuest || false} />
        <Feed isGuest={isGuest || false} />
      </div>
    </div>
  );
}
