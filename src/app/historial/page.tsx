"use client";

import { useCallback, useEffect, useState } from "react";
import { pedir } from "@/lib/http/cliente";

interface Asistencia {
  sesionId: string;
  curso: string;
  distanciaM: number;
  registradaEn: number;
}

type Estado = "cargando" | "error" | "vacio" | "listo";

export default function HistorialPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");

  const cargar = useCallback(async () => {
    try {
      const datos = await pedir<{ asistencias: Asistencia[] }>("/api/asistencias/mias");
      setAsistencias(datos.asistencias);
      setEstado(datos.asistencias.length === 0 ? "vacio" : "listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    // setState solo dentro del callback de la promesa, nunca en el cuerpo del efecto.
    pedir<{ asistencias: Asistencia[] }>("/api/asistencias/mias")
      .then((datos) => {
        if (!vivo) return;
        setAsistencias(datos.asistencias);
        setEstado(datos.asistencias.length === 0 ? "vacio" : "listo");
      })
      .catch(() => {
        if (vivo) setEstado("error");
      });
    return () => {
      vivo = false;
    };
  }, []);

  function reintentar() {
    setEstado("cargando");
    void cargar();
  }

  return (
    <section className="grid" aria-labelledby="titulo-historial" aria-live="polite">
      <h1 id="titulo-historial">Mi historial</h1>

      {estado === "cargando" ? (
        <div className="tarjeta esqueleto" aria-busy="true">
          <span />
          <span />
          <p>Cargando asistencias…</p>
        </div>
      ) : null}

      {estado === "error" ? (
        <div className="tarjeta">
          <p className="aviso aviso--error">No se pudo cargar tu historial.</p>
          <button className="boton boton--secundario" type="button" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      ) : null}

      {estado === "vacio" ? (
        <div className="tarjeta">
          <p>Aún no tienes asistencias registradas.</p>
        </div>
      ) : null}

      {estado === "listo" ? (
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Curso</th>
              <th scope="col">Fecha</th>
              <th scope="col">Distancia</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.map((asistencia) => (
              <tr key={`${asistencia.sesionId}-${asistencia.registradaEn}`}>
                <td>{asistencia.curso}</td>
                <td>
                  <time dateTime={new Date(asistencia.registradaEn).toISOString()}>
                    {new Date(asistencia.registradaEn).toLocaleString("es-CO")}
                  </time>
                </td>
                <td>{Math.round(asistencia.distanciaM)} m</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
