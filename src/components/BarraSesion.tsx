"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { borrarToken, pedir } from "@/lib/cliente";

interface Usuario {
  correo: string;
  rol: string;
}

export function BarraSesion() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    pedir<{ usuario: Usuario }>("/api/auth/yo")
      .then((datos) => {
        if (vivo) setUsuario(datos.usuario);
      })
      .catch(() => {
        if (vivo) setUsuario(null);
      })
      .finally(() => {
        if (vivo) setListo(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  async function salir() {
    borrarToken();
    await fetch("/api/auth/sesion", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (!listo) return null;

  if (!usuario) {
    return (
      <Link href="/login" aria-label="Iniciar sesión">
        Entrar
      </Link>
    );
  }

  return (
    <span>
      <span aria-hidden="true">· </span>
      {usuario.correo ? `${usuario.correo} (${usuario.rol})` : usuario.rol}{" "}
      <button type="button" onClick={() => void salir()}>
        Salir
      </button>
    </span>
  );
}
