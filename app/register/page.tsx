"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/app/actions/auth"
import { useActionState, useRef } from "react"
import { useState, useEffect } from "react"
import Script from "next/script"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

const initialState = {
  success: false,
  message: "",
}

export default function RegisterPage() {
  //const [state, formAction, pending] = useActionState(registerUser, initialState)
  const [state, formAction, pending] = useActionState(registerUser, { success: false, message: "" })
  const [sexo, setSexo] = useState("")
  const [pais, setPais] = useState("costa-rica")
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [alias, setAlias] = useState("")
  const [email, setEmail] = useState("")

  const formRef = useRef<HTMLFormElement>(null)

  async function handleClick() {
    const form = formRef.current!
    try {
      // @ts-ignore
      const token = await grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        { action: "register" }
      )
      const tokenInput = form.querySelector<HTMLInputElement>('input[name="recaptchaToken"]')
      tokenInput!.value = token
      // Dispara el submit nativo -> React ejecuta action={formAction} envuelta en transición
      form.requestSubmit()
    } catch (e) {
      alert("No se pudo validar reCAPTCHA. Intenta de nuevo.")
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">Crear Cuenta</CardTitle>
          <CardDescription>Únete a nuestra red social</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <form action={formAction} className="space-y-4"> */}
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Tu apellido" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha-nacimiento">Fecha de Nacimiento</Label>              
              <DatePicker
                selected={fechaNacimiento}
                onChange={date => setFechaNacimiento(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selecciona tu fecha de nacimiento"
                className="flex h-10 items-center justify-between w-full text-sm border rounded px-3 py-2"
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                name="fecha-nacimiento"
                id="fecha-nacimiento"
                required
              />
             
              {/* For now, keep the original input if you haven't installed react-datepicker: */}
              {/* <Input id="fecha-nacimiento" name="fecha-nacimiento" type="date" required /> */}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select name="sexo" value={sexo} onValueChange={setSexo} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                  <SelectItem value="prefiero-no-decir">Prefiero no decir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Select name="pais" value={pais} onValueChange={setPais} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="argentina">Argentina</SelectItem>
                  <SelectItem value="bolivia">Bolivia</SelectItem>
                  <SelectItem value="brasil">Brasil</SelectItem>
                  <SelectItem value="chile">Chile</SelectItem>
                  <SelectItem value="colombia">Colombia</SelectItem>
                  <SelectItem value="costa-rica">Costa Rica</SelectItem>
                  <SelectItem value="cuba">Cuba</SelectItem>
                  <SelectItem value="ecuador">Ecuador</SelectItem>
                  <SelectItem value="el-salvador">El Salvador</SelectItem>
                  <SelectItem value="espana">España</SelectItem>
                  <SelectItem value="guatemala">Guatemala</SelectItem>
                  <SelectItem value="honduras">Honduras</SelectItem>
                  <SelectItem value="mexico">México</SelectItem>
                  <SelectItem value="nicaragua">Nicaragua</SelectItem>
                  <SelectItem value="panama">Panamá</SelectItem>
                  <SelectItem value="paraguay">Paraguay</SelectItem>
                  <SelectItem value="peru">Perú</SelectItem>
                  <SelectItem value="puerto-rico">Puerto Rico</SelectItem>
                  <SelectItem value="republica-dominicana">República Dominicana</SelectItem>
                  <SelectItem value="uruguay">Uruguay</SelectItem>
                  <SelectItem value="venezuela">Venezuela</SelectItem>
                  <SelectItem value="estados-unidos">Estados Unidos</SelectItem>
                  <SelectItem value="canada">Canadá</SelectItem>
                  <SelectItem value="francia">Francia</SelectItem>
                  <SelectItem value="alemania">Alemania</SelectItem>
                  <SelectItem value="italia">Italia</SelectItem>
                  <SelectItem value="reino-unido">Reino Unido</SelectItem>
                  <SelectItem value="portugal">Portugal</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input id="alias" name="alias" value={alias} onChange={e => setAlias(e.target.value)} placeholder="Tu nombre de usuario" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="datos-ocultos" name="datos-ocultos" />
              <Label htmlFor="datos-ocultos" className="text-sm">
                Deseo mantener mis datos ocultos
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="Tu contraseña" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="Confirma tu contraseña"
                required
              />
            </div>

            {/* Hidden para reCAPTCHA */}
            <input type="hidden" name="recaptchaToken" />
            <input type="hidden" name="recaptchaAction" value="register" />

            {state?.message && (
              <div className={`text-center text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
                {state.message}
              </div>
            )}

            <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

            {/* <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={pending}>
              {pending ? "Creando cuenta..." : "Crear Cuenta"}
            </Button> */}
            {/* type="button" para evitar submit automático */}
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={pending}
              onClick={handleClick}
            >
              {pending ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

          </form>

          <div className="text-center text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        strategy="afterInteractive"
      />
    </div>
  )
}
