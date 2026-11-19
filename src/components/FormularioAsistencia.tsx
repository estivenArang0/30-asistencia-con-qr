"use client";

import { useState } from "react";
import { ErrorApi, pedir } from "@/lib/http/cliente";
import { urlMapa } from "@/lib/utils/mapa";

interface Props {
  token: string;
}

interface Ubicacion {
  lat: number;
  lng: number;
  accuracy: number;
}

export function FormularioAsistencia({ token }: Props) {
  const [estado, setEstado] = useState<"inicial" | "enviando" | "ok" | "error">("inicial");
  const [mensaje, setMensaje] = useState("");
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);

  function registrar(lat: number, lng: number) {
    setEstado("enviando");
    setMensaje("Registrando tu asistencia…");
    pedir<{ distanciaM: number }>("/api/asistencias", {
      method: "POST",
      body: JSON.stringify({ token, lat, lng }),
    })
      .then((resultado) => {
        setEstado("ok");
        setMensaje(`Asistencia registrada. Estabas a ${Math.round(resultado.distanciaM)} m del aula.`);
      })
      .catch((error: unknown) => {
        setEstado("error");
        setMensaje(error instanceof ErrorApi ? error.message : "No se pudo registrar la asistencia.");
      });
  }

  function usarUbicacion() {
    if (!("geolocation" in navigator)) {
      setEstado("error");
      setMensaje("Este navegador no permite obtener la ubicación. Avisa al docente.");
      return;
    }
    setEstado("inicial");
    setMensaje("Pidiendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const { latitude, longitude, accuracy } = posicion.coords;
        setUbicacion({ lat: latitude, lng: longitude, accuracy });
        setEstado("inicial");
        setMensaje("Ubicación capturada. Revísala y registra tu asistencia.");
      },
      (error) => {
        setEstado("error");
        setMensaje(
          `No se pudo obtener la ubicación (${error.code}: ${error.message || "sin detalle"}). Actívala e inténtalo otra vez.`,
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function confirmar() {
    if (!ubicacion) return;
    registrar(ubicacion.lat, ubicacion.lng);
  }

  return (
    <section className="tarjeta">
      <h1>Registrar asistencia</h1>
      <p>
        Al pulsar el botón se pedirá tu ubicación para comprobar que estás dentro del aula. Nada se
        envía hasta que lo autorices.
      </p>
      <button className="boton" type="button" onClick={usarUbicacion} disabled={estado === "enviando"}>
        {estado === "enviando" ? "Comprobando…" : "Usar mi ubicación"}
      </button>

      {ubicacion ? (
        <>
          <p>
            Tu ubicación: {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)} (±
            {Math.round(ubicacion.accuracy)} m){" "}
            <a
              href={urlMapa(ubicacion.lat, ubicacion.lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en el mapa
            </a>
          </p>
          <button
            className="boton"
            type="button"
            onClick={confirmar}
            disabled={estado === "enviando" || estado === "ok"}
          >
            Registrar asistencia
          </button>
        </>
      ) : null}

      <p
        className={estado === "error" ? "aviso aviso--error" : "aviso"}
        role="status"
        aria-live="polite"
      >
        {mensaje}
      </p>
    </section>
  );
}
