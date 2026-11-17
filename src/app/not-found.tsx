import Link from "next/link";

export default function NotFound() {
  return (
    <div className="tarjeta">
      <h1>Página no encontrada</h1>
      <p>La dirección no existe o ya no está disponible.</p>
      <Link className="boton" href="/">
        Volver al inicio
      </Link>
    </div>
  );
}
