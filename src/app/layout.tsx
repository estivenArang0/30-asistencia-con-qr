import Link from "next/link";
import type { Metadata } from "next";
import { BarraSesion } from "@/components/BarraSesion";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control de asistencia con QR",
  description: "El docente abre una sesión y los estudiantes registran su asistencia validada por tiempo y ubicación.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        <header className="cabecera">
          <div className="envoltorio cabecera__fila">
            <Link className="marca" href="/">
              Asistencia QR
            </Link>
            <nav className="navegacion" aria-label="Principal">
              <ul>
                <li>
                  <Link href="/">Inicio</Link>
                </li>
                <li>
                  <Link href="/historial">Historial</Link>
                </li>
                <li>
                  <Link href="/login">Cuenta</Link>
                </li>
                <li>
                  <BarraSesion />
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main id="contenido" className="envoltorio contenido" tabIndex={-1}>
          {children}
        </main>
        <footer className="pie">
          <div className="envoltorio">
            <p>Proyecto 30 · Control de asistencia con QR y ubicación · Modo desarrollo.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
