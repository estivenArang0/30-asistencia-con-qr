"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { guardarToken } from "@/lib/cliente";
import { authCliente, firebaseWebConfigurado } from "@/lib/firebase-client";

const MENSAJES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no tiene un formato válido.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
  "auth/network-request-failed": "No hay conexión con Firebase.",
};

export default function LoginPage() {
  const router = useRouter();
  const configurado = firebaseWebConfigurado();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [uidDev, setUidDev] = useState("docente1");
  const [rolDev, setRolDev] = useState<"docente" | "estudiante">("docente");

  async function entrarReal(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const credencial = await signInWithEmailAndPassword(authCliente(), correo, contrasena);
      const idToken = await credencial.user.getIdToken(true);
      const respuesta = await fetch("/api/auth/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
        throw new Error(cuerpo.error ?? "No se pudo crear la sesión.");
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      const codigo = (error as { code?: string }).code ?? "";
      setMensaje(
        MENSAJES[codigo] ?? (error instanceof Error ? error.message : "No se pudo iniciar sesión."),
      );
    } finally {
      setEnviando(false);
    }
  }

  function entrarDev(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = uidDev.trim().replaceAll(" ", "");
    if (!limpio) return;
    guardarToken(`dev.${limpio}.${rolDev}`);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="tarjeta">
      <h1>Entrar</h1>

      {configurado ? (
        <form className="grid" onSubmit={entrarReal}>
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              required
            />
          </div>
          <button className="boton" type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
          <p className={mensaje ? "aviso aviso--error" : "aviso"} role="status" aria-live="polite">
            {mensaje}
          </p>
        </form>
      ) : (
        <div className="grid">
          <p className="aviso aviso--error">
            Firebase web no está configurado: faltan <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> y
            <code> NEXT_PUBLIC_FIREBASE_APP_ID</code> en <code>.env.local</code>.
          </p>
          <form className="grid" onSubmit={entrarDev}>
            <div className="campo">
              <label htmlFor="uid">Usuario (modo desarrollo)</label>
              <input
                id="uid"
                name="uid"
                value={uidDev}
                onChange={(evento) => setUidDev(evento.target.value)}
                autoComplete="username"
                required
              />
              <small>Solo si AUTH_DEV=1 fuera de producción.</small>
            </div>
            <div className="campo">
              <label htmlFor="rol">Rol</label>
              <select
                id="rol"
                name="rol"
                value={rolDev}
                onChange={(evento) => setRolDev(evento.target.value as "docente" | "estudiante")}
              >
                <option value="docente">Docente</option>
                <option value="estudiante">Estudiante</option>
              </select>
            </div>
            <button className="boton" type="submit">
              Entrar en modo desarrollo
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
