"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TarjetaSesion } from "@/components/TarjetaSesion";
import { pedir } from "@/lib/http/cliente";
import { ordenarSesiones } from "@/lib/utils/estado-sesion";

interface Usuario {
  uid: string;
  correo: string;
  rol: "docente" | "estudiante";
}

interface SesionListada {
  id: string;
  curso: string;
  inicia: string;
  termina: string;
}

type Estado = "cargando" | "error" | "vacio" | "listo";

export default function InicioPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [sesiones, setSesiones] = useState<SesionListada[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ahoraMs, setAhoraMs] = useState(0);

  useEffect(() => {
    const actualizar = () => setAhoraMs(Date.now());
    actualizar();
    const intervalo = window.setInterval(actualizar, 30_000);
    return () => window.clearInterval(intervalo);
  }, []);

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
        if (vivo) setCargandoUsuario(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

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
    pedir<{ sesiones: SesionListada[] }>("/api/sesiones")
      .then((datos) => {
        setSesiones(datos.sesiones);
        setEstado(datos.sesiones.length === 0 ? "vacio" : "listo");
      })
      .catch(() => setEstado("error"));
  }

  if (cargandoUsuario) {
    return (
      <div className="tarjeta esqueleto" aria-busy="true">
        <span />
        <span />
        <p>Cargando tu cuenta…</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="tarjeta">
        <h1>Control de asistencia con QR</h1>
        <p>Necesitas iniciar sesión para usar el tablero.</p>
        <Link className="boton" href="/login">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (usuario.rol === "estudiante") {
    return (
      <div className="tarjeta">
        <h1>{usuario.correo ? `Hola, ${usuario.correo}` : "Hola"}</h1>
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
          {ordenarSesiones(sesiones, ahoraMs).map((sesion) => (
            <TarjetaSesion key={sesion.id} sesion={sesion} ahoraMs={ahoraMs} />
          ))}
        </div>
      ) : null}

      <p>
        <Link href="/docente/sesiones/nueva">Abrir una sesión nueva</Link>
      </p>
    </section>
  );
}
