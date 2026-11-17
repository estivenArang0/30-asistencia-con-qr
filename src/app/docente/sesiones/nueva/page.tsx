import { FormularioNuevaSesion } from "@/components/FormularioNuevaSesion";

export default function NuevaSesionPage() {
  return (
    <section className="grid">
      <h1>Abrir una sesión</h1>
      <p>Define el curso, el aula y la ventana de tiempo en la que se puede registrar la asistencia.</p>
      <FormularioNuevaSesion />
    </section>
  );
}
