import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioNuevaSesion } from "@/components/FormularioNuevaSesion";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ubicación del formulario de sesión", () => {
  it("pide alta precisión y avisa si supera 100 m", async () => {
    const getCurrentPosition = vi.fn((exito: PositionCallback) =>
      exito({
        coords: { latitude: 6.2, longitude: -75.5, accuracy: 150 },
      } as GeolocationPosition),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    const usuario = userEvent.setup();

    render(<FormularioNuevaSesion />);
    await usuario.click(screen.getByRole("button", { name: /Usar mi ubicación/ }));

    expect(await screen.findByText(/Ubicación poco precisa/)).toBeInTheDocument();
    expect(screen.getByText(/±150 m/)).toBeInTheDocument();
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });

  it("no avisa si la precisión es 100 m o mejor", async () => {
    const getCurrentPosition = vi.fn((exito: PositionCallback) =>
      exito({
        coords: { latitude: 6.2, longitude: -75.5, accuracy: 100 },
      } as GeolocationPosition),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    const usuario = userEvent.setup();

    render(<FormularioNuevaSesion />);
    await usuario.click(screen.getByRole("button", { name: /Usar mi ubicación/ }));

    expect(await screen.findByText(/±100 m/)).toBeInTheDocument();
    expect(screen.queryByText(/Ubicación poco precisa/)).toBeNull();
  });
});
