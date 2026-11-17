"use client";

export interface Asistente {
  uid: string;
  distanciaM: number;
  registradaEn: number;
}

export type EstadoLista = "cargando" | "error" | "vacio" | "listo";

interface Props {
  estado: EstadoLista;
  asistentes: Asistente[];
  onReintentar?: () => void;
}

function hora(ms: number): string {
  return new Date(ms).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function ListaAsistentes({ estado, asistentes, onReintentar }: Props) {
  return (
    <section className="tarjeta" aria-labelledby="titulo-asistentes" aria-live="polite">
      <h2 id="titulo-asistentes">Asistentes</h2>

      {estado === "cargando" ? (
        <div className="esqueleto" aria-busy="true">
          <span />
          <span />
          <span />
          <p>Cargando asistentes…</p>
        </div>
      ) : null}

      {estado === "error" ? (
        <div>
          <p className="aviso aviso--error">No se pudieron cargar los asistentes.</p>
          {onReintentar ? (
            <button className="boton boton--secundario" type="button" onClick={onReintentar}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {estado === "vacio" ? <p>Todavía no hay asistentes registrados.</p> : null}

      {estado === "listo" ? (
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Estudiante</th>
              <th scope="col">Distancia</th>
              <th scope="col">Hora</th>
            </tr>
          </thead>
          <tbody>
            {asistentes.map((asistente) => (
              <tr key={asistente.uid}>
                <td>{asistente.uid}</td>
                <td>{Math.round(asistente.distanciaM)} m</td>
                <td>{hora(asistente.registradaEn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
