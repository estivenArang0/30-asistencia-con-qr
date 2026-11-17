"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { borrarToken, leerToken, usuarioDelToken, type UsuarioDev } from "@/lib/cliente";

export function BarraSesion() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioDev | null>(() =>
    typeof window === "undefined" ? null : usuarioDelToken(leerToken()),
  );

  useEffect(() => {
    const alCambiar = () => setUsuario(usuarioDelToken(leerToken()));
    window.addEventListener("storage", alCambiar);
    return () => window.removeEventListener("storage", alCambiar);
  }, []);

  if (!usuario) {
    return (
      <Link href="/login" aria-label="Iniciar sesión de desarrollo">
        Entrar
      </Link>
    );
  }

  return (
    <span>
      <span aria-hidden="true">· </span>
      {usuario.uid} ({usuario.rol}){" "}
      <button
        type="button"
        onClick={() => {
          borrarToken();
          router.push("/login");
        }}
      >
        Salir
      </button>
    </span>
  );
}
