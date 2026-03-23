"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSite, setPasswordSite] = useState("");
  const [data, setData] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nueva contraseña y confirmación",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Error",
        description: "Token no encontrado en la URL",
        variant: "destructive",
      });
      return;
    }

    try {
      //console.log("Token:", token); // solo para debug — no mostrar en producción
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmNewPassword,
          token,
          passwordSite,
        }),
      });
      const data = await response.json();
      setData(data);

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Tu contraseña ha sido restablecida",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Error al restablecer la contraseña",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Restablecer Contraseña
          </CardTitle>
          <CardDescription>Recupera el acceso a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña nueva</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                required
              />
              <Label htmlFor="confirm-new-password">
                Confirmar nueva contraseña
              </Label>
              <Input
                id="confirm-new-password"
                name="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirmar nueva contraseña"
                required
              />
              <input
                type="text"
                name="passwordSite"
                value={passwordSite}
                onChange={(e) => setPasswordSite(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            {data?.message &&  (
              <div
                className={`text-center text-sm ${
                  data.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.message}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800"
            >
              Restablecer contraseña
            </Button>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Iniciar Sesión
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
