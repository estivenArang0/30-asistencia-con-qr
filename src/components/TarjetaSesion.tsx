import Link from "next/link";
import { ETIQUETA_ESTADO, estadoSesion } from "@/lib/utils/estado-sesion";
import { formatearFechaHora } from "@/lib/utils/fechas";

export interface SesionTarjeta {
  id: string;
  curso: string;
  inicia: string;
  termina: string;
}

export function TarjetaSesion({ sesion, ahoraMs }: { sesion: SesionTarjeta; ahoraMs: number }) {
  const estado = estadoSesion(sesion.inicia, sesion.termina, ahoraMs);
  return (
    <article className="tarjeta">
      <h2>{sesion.curso}</h2>
      <p>
        <strong>Estado:</strong> {ETIQUETA_ESTADO[estado]}
      </p>
      <p>
        Inicia: <time dateTime={sesion.inicia}>{formatearFechaHora(sesion.inicia)}</time>
      </p>
      <p>
        Termina: <time dateTime={sesion.termina}>{formatearFechaHora(sesion.termina)}</time>
      </p>
      <Link className="boton boton--secundario" href={`/docente/sesiones/${sesion.id}`}>
        {estado === "terminada" ? "Ver asistentes" : "Ver QR y asistentes"}
      </Link>
    </article>
  );
}
