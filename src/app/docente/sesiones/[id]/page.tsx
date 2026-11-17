"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toDataURL } from "qrcode";
import { useCallback, useState } from "react";
import { ListaAsistentes, type Asistente, type EstadoLista } from "@/components/ListaAsistentes";
import { useCountdown } from "@/hooks/useCountdown";
import { usePaginaVisible } from "@/hooks/usePaginaVisible";
import { usePolling } from "@/hooks/usePolling";
import { ErrorApi, leerToken, pedir } from "@/lib/cliente";
import { urlAsistencia } from "@/lib/url-asistencia";

interface DatosQr {
  token: string;
  expiraEnMs: number;
}

export default function SesionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const visible = usePaginaVisible();
  const restantes = useCountdown(30, visible);

  const [imagen, setImagen] = useState<string | null>(null);
  const [enlace, setEnlace] = useState<string | null>(null);
  const [errorQr, setErrorQr] = useState<string | null>(null);
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [estadoLista, setEstadoLista] = useState<EstadoLista>("cargando");

  const cargarQr = useCallback(async () => {
    try {
      const datos = await pedir<DatosQr>(`/api/sesiones/${id}/qr`);
      const url = urlAsistencia(window.location.origin, datos.token);
      setEnlace(url);
      setImagen(await toDataURL(url, { margin: 1, width: 280 }));
      setErrorQr(null);
    } catch (error) {
      setErrorQr(error instanceof ErrorApi ? error.message : "No se pudo cargar el código QR.");
    }
  }, [id]);

  const cargarAsistentes = useCallback(async () => {
    try {
      const datos = await pedir<{ asistentes: Asistente[] }>(`/api/sesiones/${id}/asistentes`);
      setAsistentes(datos.asistentes);
      setEstadoLista(datos.asistentes.length === 0 ? "vacio" : "listo");
    } catch {
      setEstadoLista("error");
    }
  }, [id]);

  // El QR se renueva cada 30 s; se pausa si la pestaña no está visible.
  usePolling(cargarQr, 30000, visible);

  usePolling(cargarAsistentes, 5000, visible);

  async function exportar() {
    try {
      const actual = leerToken();
      const respuesta = await fetch(`/api/sesiones/${id}/exportar`, {
        headers: actual ? { Authorization: `Bearer ${actual}` } : undefined,
      });
      if (!respuesta.ok) throw new Error("No se pudo exportar el CSV.");
      const blob = await respuesta.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `asistentes-${id}.csv`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorQr(error instanceof Error ? error.message : "No se pudo exportar el CSV.");
    }
  }

  return (
    <section className="grid" aria-labelledby="titulo-sesion">
      <h1 id="titulo-sesion">Sesión en vivo</h1>
      <p>
        Muestra este QR al curso. Cambia cada 30 s y la lista se actualiza sola.
        {visible ? "" : " Actualización pausada: la pestaña está en segundo plano."}
      </p>

      <div className="tarjeta qr" aria-busy={!imagen && !errorQr}>
        {errorQr ? (
          <div>
            <p className="aviso aviso--error">{errorQr}</p>
            <button className="boton boton--secundario" type="button" onClick={() => void cargarQr()}>
              Reintentar
            </button>
          </div>
        ) : null}

        {imagen ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagen} alt="Código QR para registrar la asistencia de esta sesión" width={280} height={280} />
            <p className="contador" aria-live="polite">
              Se renueva en {restantes} s
            </p>
            {enlace ? (
              <p>
                Enlace de respaldo:{" "}
                <Link href={enlace}>abrir la página de asistencia</Link>
              </p>
            ) : null}
          </>
        ) : null}

        {!imagen && !errorQr ? <p>Generando el código QR…</p> : null}
      </div>

      <ListaAsistentes
        estado={estadoLista}
        asistentes={asistentes}
        onReintentar={() => void cargarAsistentes()}
      />

      <button className="boton boton--secundario" type="button" onClick={() => void exportar()}>
        Exportar asistentes (CSV)
      </button>
    </section>
  );
}
