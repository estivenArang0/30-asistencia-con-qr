import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioAsistencia } from "@/components/FormularioAsistencia";
import { FormularioNuevaSesion } from "@/components/FormularioNuevaSesion";
import { ListaAsistentes } from "@/components/ListaAsistentes";

// Los componentes usan el router de Next; en Vitest no hay App Router montado.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: "sesion-1" }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("formulario de nueva sesión", () => {
  it("muestra el error de validación junto al campo", async () => {
    const usuario = userEvent.setup();
    render(<FormularioNuevaSesion />);

    await usuario.click(screen.getByRole("button", { name: "Crear sesión" }));

    expect(await screen.findByText("El curso es obligatorio.")).toBeInTheDocument();
    expect(screen.getByLabelText("Curso")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("lista de asistentes", () => {
  it("muestra el estado vacío", () => {
    render(<ListaAsistentes estado="vacio" asistentes={[]} />);
    expect(screen.getByText("Todavía no hay asistentes registrados.")).toBeInTheDocument();
  });

  it("muestra los asistentes con su distancia", () => {
    render(
      <ListaAsistentes
        estado="listo"
        asistentes={[{ uid: "ana", distanciaM: 12.4, registradaEn: Date.now() }]}
      />,
    );
    expect(screen.getByRole("cell", { name: "ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "12 m" })).toBeInTheDocument();
  });
});

describe("página de asistir", () => {
  it("avisa cuando el navegador no ofrece geolocalización", async () => {
    const usuario = userEvent.setup();
    render(<FormularioAsistencia token="token-de-prueba" />);

    await usuario.click(screen.getByRole("button", { name: "Usar mi ubicación y registrar" }));

    expect(await screen.findByText(/no permite obtener la ubicación/i)).toBeInTheDocument();
  });

  it("muestra el mensaje de 422 con distancia y radio", async () => {
    const usuario = userEvent.setup();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (exito: PositionCallback) =>
          exito({ coords: { latitude: 6.2, longitude: -75.5 } } as GeolocationPosition),
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ error: "Estás a 500 m del aula y el radio permitido es 100 m." }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(<FormularioAsistencia token="token-de-prueba" />);
    await usuario.click(screen.getByRole("button", { name: "Usar mi ubicación y registrar" }));

    expect(await screen.findByText(/500 m del aula/)).toBeInTheDocument();
    expect(screen.getByText(/100 m/)).toBeInTheDocument();
  });
});
