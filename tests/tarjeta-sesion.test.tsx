import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TarjetaSesion } from "@/components/TarjetaSesion";

const ABIERTA = {
  id: "sesion-1",
  curso: "Matemáticas",
  inicia: "2026-11-17T10:00:00-05:00",
  termina: "2026-11-17T11:00:00-05:00",
};

const TERMINADA = {
  id: "sesion-2",
  curso: "Física",
  inicia: "2026-11-17T08:00:00-05:00",
  termina: "2026-11-17T09:00:00-05:00",
};

describe("TarjetaSesion", () => {
  it("muestra inicio, fin y estado abierto", () => {
    const { container } = render(
      <TarjetaSesion sesion={ABIERTA} ahoraMs={Date.parse("2026-11-17T10:30:00-05:00")} />,
    );

    expect(screen.getByText(/Inicia:/)).toBeInTheDocument();
    expect(screen.getByText(/Termina:/)).toBeInTheDocument();
    expect(screen.getByText(/Abierta/)).toBeInTheDocument();
    const tiempos = container.querySelectorAll("time");
    expect(tiempos[0]).toHaveAttribute("dateTime", ABIERTA.inicia);
    expect(tiempos[1]).toHaveAttribute("dateTime", ABIERTA.termina);
  });

  it("en una sesión terminada no ofrece el QR como acción principal", () => {
    render(<TarjetaSesion sesion={TERMINADA} ahoraMs={Date.parse("2026-11-17T10:30:00-05:00")} />);

    expect(screen.getByText(/Terminada/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver asistentes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver QR y asistentes" })).toBeNull();
  });
});
