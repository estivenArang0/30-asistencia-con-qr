import { FormularioAsistencia } from "@/components/FormularioAsistencia";
import { obtenerSecretoQr } from "@/lib/config";
import { AppError } from "@/lib/errores";
import { verificarToken } from "@/services/qr-token";

export const runtime = "nodejs";

/** Valida el token fuera del cuerpo del componente (regla de pureza de React). */
function mensajeDeValidacion(token: string): string | null {
  try {
    verificarToken(token, obtenerSecretoQr(), Date.now());
    return null;
  } catch (fallo) {
    return fallo instanceof AppError
      ? fallo.message
      : "No se pudo validar el código QR. Pide uno nuevo al docente.";
  }
}

export default async function AsistirPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const error = mensajeDeValidacion(token);

  if (error) {
    return (
      <div className="tarjeta">
        <h1>No se puede registrar la asistencia</h1>
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
        <p>Vuelve a escanear el código que muestra el docente.</p>
      </div>
    );
  }

  return <FormularioAsistencia token={token} />;
}
