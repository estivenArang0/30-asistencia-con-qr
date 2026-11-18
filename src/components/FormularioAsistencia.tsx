"use client";

import { useState } from "react";
import { ErrorApi, pedir } from "@/lib/cliente";

interface Props {
  token: string;
}

export function FormularioAsistencia({ token }: Props) {
  const [estado, setEstado] = useState<"inicial" | "enviando" | "ok" | "error">("inicial");
  const [mensaje, setMensaje] = useState("");

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
    setEstado("enviando");
    setMensaje("Pidiendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (posicion) => registrar(posicion.coords.latitude, posicion.coords.longitude),
      () => {
        setEstado("error");
        setMensaje("No diste permiso de ubicación o falló el GPS. Actívalo e inténtalo otra vez.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <section className="tarjeta">
      <h1>Registrar asistencia</h1>
      <p>
        Al pulsar el botón se pedirá tu ubicación para comprobar que estás dentro del aula. Nada se
        envía hasta que lo autorices.
      </p>
      <button className="boton" type="button" onClick={usarUbicacion} disabled={estado === "enviando"}>
        {estado === "enviando" ? "Comprobando…" : "Usar mi ubicación y registrar"}
      </button>
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
