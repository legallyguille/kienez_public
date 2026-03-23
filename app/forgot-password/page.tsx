"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { sendPasswordResetEmail } from "@/app/actions/auth";

const initialState = {
  success: false,
  message: "",
};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    sendPasswordResetEmail,
    initialState
  );

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
          <form className="space-y-4" action={formAction}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
              />
              <input
                type="text"
                name="emailSite"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            {state?.message && (
              <div
                className={`text-center text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
                {state.message}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-700 hover:to-purple-800"
            >
              Enviar enlace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
