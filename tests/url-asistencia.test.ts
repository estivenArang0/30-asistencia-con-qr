import { describe, expect, it } from "vitest";
import { urlAsistencia } from "@/lib/utils/url-asistencia";

describe("urlAsistencia", () => {
  it("construye la URL absoluta de asistencia", () => {
    expect(urlAsistencia("https://asistencia.example.com", "abc123")).toBe(
      "https://asistencia.example.com/asistir/abc123",
    );
  });

  it("no duplica barras si el origen termina en /", () => {
    expect(urlAsistencia("https://asistencia.example.com/", "abc123")).toBe(
      "https://asistencia.example.com/asistir/abc123",
    );
    expect(urlAsistencia("https://asistencia.example.com///", "abc123")).toBe(
      "https://asistencia.example.com/asistir/abc123",
    );
  });
});
