export default function Loading() {
  return (
    <div className="tarjeta" aria-live="polite" aria-busy="true">
      <p>Cargando…</p>
      <div className="esqueleto" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
