"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="tarjeta" role="alert">
      <h1>Algo salió mal</h1>
      <p>No se pudo cargar esta página. Puedes intentarlo de nuevo.</p>
      <button className="boton" type="button" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
