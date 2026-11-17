"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { guardarToken } from "@/lib/cliente";

export default function LoginPage() {
  const router = useRouter();
  const [uid, setUid] = useState("docente1");
  const [rol, setRol] = useState<"docente" | "estudiante">("docente");

  function entrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = uid.trim().replaceAll(" ", "");
    if (!limpio) return;
    guardarToken(`dev.${limpio}.${rol}`);
    router.push("/");
  }

  return (
    <div className="tarjeta">
      <h1>Entrar (modo desarrollo)</h1>
      <p className="aviso aviso--error">
        Login de desarrollo: no hay contraseña ni Firebase. Cualquiera con acceso a esta página puede
        entrar. No usar en producción.
      </p>
      <form onSubmit={entrar} className="grid">
        <div className="campo">
          <label htmlFor="uid">Usuario</label>
          <input
            id="uid"
            name="uid"
            value={uid}
            onChange={(evento) => setUid(evento.target.value)}
            autoComplete="username"
            required
          />
          <small>El token se guarda en sessionStorage de esta pestaña.</small>
        </div>

        <div className="campo">
          <label htmlFor="rol">Rol</label>
          <select
            id="rol"
            name="rol"
            value={rol}
            onChange={(evento) => setRol(evento.target.value as "docente" | "estudiante")}
          >
            <option value="docente">Docente</option>
            <option value="estudiante">Estudiante</option>
          </select>
        </div>

        <button className="boton" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
