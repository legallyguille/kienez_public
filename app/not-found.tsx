"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Origami } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Origami className="mx-auto h-16 w-16 text-blue-500" />
      <h1 className="mt-6 text-3xl font-bold text-blue-600">
        Página no encontrada
      </h1>
      <p>Redirigiendo...</p>
    </div>
  );
}
