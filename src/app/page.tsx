"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { leerToken, pedir, usuarioDelToken, type UsuarioDev } from "@/lib/cliente";

interface SesionListada {
  id: string;
  curso: string;
  inicia: string;
  termina: string;
}

type Estado = "cargando" | "error" | "vacio" | "listo";

export default function InicioPage() {
  const [usuario] = useState<UsuarioDev | null>(() =>
    typeof window === "undefined" ? null : usuarioDelToken(leerToken()),
  );
  const [sesiones, setSesiones] = useState<SesionListada[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");

  const cargar = useCallback(async () => {
    if (!usuario || usuario.rol !== "docente") return;
    try {
      const datos = await pedir<{ sesiones: SesionListada[] }>("/api/sesiones");
      setSesiones(datos.sesiones);
      setEstado(datos.sesiones.length === 0 ? "vacio" : "listo");
    } catch {
      setEstado("error");
    }
  }, [usuario]);

  useEffect(() => {
    if (!usuario || usuario.rol !== "docente") return;
    let vivo = true;
    // setState solo dentro del callback de la promesa, nunca en el cuerpo del efecto.
    pedir<{ sesiones: SesionListada[] }>("/api/sesiones")
      .then((datos) => {
        if (!vivo) return;
        setSesiones(datos.sesiones);
        setEstado(datos.sesiones.length === 0 ? "vacio" : "listo");
      })
      .catch(() => {
        if (vivo) setEstado("error");
      });
    return () => {
      vivo = false;
    };
  }, [usuario]);

  function reintentar() {
    setEstado("cargando");
    void cargar();
  }

  if (!usuario) {
    return (
      <div className="tarjeta">
        <h1>Control de asistencia con QR</h1>
        <p>Necesitas iniciar sesión para usar el tablero.</p>
        <Link className="boton" href="/login">
          Iniciar sesión de desarrollo
        </Link>
      </div>
    );
  }

  if (usuario.rol === "estudiante") {
    return (
      <div className="tarjeta">
        <h1>Hola, {usuario.uid}</h1>
        <p>Cuando el docente muestre el QR, escanéalo o abre el enlace para registrar tu asistencia.</p>
        <Link className="boton" href="/historial">
          Ver mi historial
        </Link>
      </div>
    );
  }

  return (
    <section className="grid" aria-labelledby="titulo-sesiones" aria-live="polite">
      <h1 id="titulo-sesiones">Mis sesiones</h1>

      {estado === "cargando" ? (
        <div className="tarjeta esqueleto" aria-busy="true">
          <span />
          <span />
          <span />
          <p>Cargando sesiones…</p>
        </div>
      ) : null}

      {estado === "error" ? (
        <div className="tarjeta">
          <p className="aviso aviso--error">No se pudieron cargar tus sesiones.</p>
          <button className="boton boton--secundario" type="button" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      ) : null}

      {estado === "vacio" ? (
        <div className="tarjeta">
          <p>Todavía no has abierto ninguna sesión.</p>
          <Link className="boton" href="/docente/sesiones/nueva">
            Abrir mi primera sesión
          </Link>
        </div>
      ) : null}

      {estado === "listo" ? (
        <div className="grid grid--dos">
          {sesiones.map((sesion) => (
            <article className="tarjeta" key={sesion.id}>
              <h2>{sesion.curso}</h2>
              <p>
                <time dateTime={sesion.inicia}>{new Date(sesion.inicia).toLocaleString("es-CO")}</time>
              </p>
              <Link className="boton boton--secundario" href={`/docente/sesiones/${sesion.id}`}>
                Ver QR y asistentes
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      <p>
        <Link href="/docente/sesiones/nueva">Abrir una sesión nueva</Link>
      </p>
    </section>
  );
}
