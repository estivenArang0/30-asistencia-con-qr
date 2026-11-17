"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZodError } from "zod";
import { pedir } from "@/lib/cliente";
import { esquemaSesion } from "@/schemas/asistencia";

interface Errores {
  [campo: string]: string;
}

export function FormularioNuevaSesion() {
  const router = useRouter();
  const [valores, setValores] = useState({
    curso: "",
    lat: "",
    lng: "",
    radioM: "100",
    inicia: "",
    termina: "",
  });
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo: keyof typeof valores, valor: string) {
    setValores((actual) => ({ ...actual, [campo]: valor }));
  }

  function usarMiUbicacion() {
    if (!("geolocation" in navigator)) {
      setAviso("Este navegador no ofrece ubicación. Escribe las coordenadas a mano.");
      return;
    }
    setAviso("Pidiendo ubicación…");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        cambiar("lat", posicion.coords.latitude.toFixed(6));
        cambiar("lng", posicion.coords.longitude.toFixed(6));
        setAviso("Ubicación tomada del navegador.");
      },
      () => setAviso("No se pudo obtener la ubicación. Escribe las coordenadas a mano."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrores({});
    setAviso(null);

    try {
      const datos = esquemaSesion.parse({
        curso: valores.curso,
        lat: Number(valores.lat),
        lng: Number(valores.lng),
        radioM: Number(valores.radioM),
        inicia: valores.inicia ? new Date(valores.inicia).toISOString() : "",
        termina: valores.termina ? new Date(valores.termina).toISOString() : "",
      });

      setEnviando(true);
      const sesion = await pedir<{ id: string }>("/api/sesiones", {
        method: "POST",
        body: JSON.stringify(datos),
      });
      router.push(`/docente/sesiones/${sesion.id}`);
    } catch (error) {
      if (error instanceof ZodError) {
        const nuevos: Errores = {};
        for (const problema of error.issues) {
          const campo = String(problema.path[0] ?? "");
          if (campo && !nuevos[campo]) nuevos[campo] = problema.message;
        }
        setErrores(nuevos);
        setAviso("Revisa los campos marcados.");
      } else {
        setAviso(error instanceof Error ? error.message : "No se pudo crear la sesión.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function errorDe(campo: string): string | null {
    return errores[campo] ?? null;
  }

  return (
    <form className="tarjeta" onSubmit={enviar} noValidate aria-describedby="aviso-formulario">
      <div className="campo">
        <label htmlFor="curso">Curso</label>
        <input
          id="curso"
          name="curso"
          value={valores.curso}
          onChange={(evento) => cambiar("curso", evento.target.value)}
          aria-invalid={Boolean(errorDe("curso"))}
          aria-describedby={errorDe("curso") ? "error-curso" : undefined}
          autoComplete="organization"
        />
        {errorDe("curso") ? (
          <p className="error-campo" id="error-curso">
            {errorDe("curso")}
          </p>
        ) : null}
      </div>

      <fieldset className="campo">
        <legend>Ubicación del aula</legend>
        <p>
          <small>Puedes usar la ubicación del navegador o escribir las coordenadas.</small>
        </p>
        <button className="boton boton--secundario" type="button" onClick={usarMiUbicacion}>
          Usar mi ubicación
        </button>
        <div className="grid grid--dos">
          <div className="campo">
            <label htmlFor="lat">Latitud</label>
            <input
              id="lat"
              name="lat"
              inputMode="decimal"
              value={valores.lat}
              onChange={(evento) => cambiar("lat", evento.target.value)}
              aria-invalid={Boolean(errorDe("lat"))}
            />
            {errorDe("lat") ? <p className="error-campo">{errorDe("lat")}</p> : null}
          </div>
          <div className="campo">
            <label htmlFor="lng">Longitud</label>
            <input
              id="lng"
              name="lng"
              inputMode="decimal"
              value={valores.lng}
              onChange={(evento) => cambiar("lng", evento.target.value)}
              aria-invalid={Boolean(errorDe("lng"))}
            />
            {errorDe("lng") ? <p className="error-campo">{errorDe("lng")}</p> : null}
          </div>
        </div>
      </fieldset>

      <div className="campo">
        <label htmlFor="radioM">Radio permitido (metros)</label>
        <input
          id="radioM"
          name="radioM"
          inputMode="numeric"
          value={valores.radioM}
          onChange={(evento) => cambiar("radioM", evento.target.value)}
          aria-invalid={Boolean(errorDe("radioM"))}
        />
        {errorDe("radioM") ? <p className="error-campo">{errorDe("radioM")}</p> : null}
      </div>

      <div className="grid grid--dos">
        <div className="campo">
          <label htmlFor="inicia">Inicio</label>
          <input
            id="inicia"
            name="inicia"
            type="datetime-local"
            value={valores.inicia}
            onChange={(evento) => cambiar("inicia", evento.target.value)}
            aria-invalid={Boolean(errorDe("inicia"))}
          />
          {errorDe("inicia") ? <p className="error-campo">{errorDe("inicia")}</p> : null}
        </div>
        <div className="campo">
          <label htmlFor="termina">Fin</label>
          <input
            id="termina"
            name="termina"
            type="datetime-local"
            value={valores.termina}
            onChange={(evento) => cambiar("termina", evento.target.value)}
            aria-invalid={Boolean(errorDe("termina"))}
          />
          {errorDe("termina") ? <p className="error-campo">{errorDe("termina")}</p> : null}
        </div>
      </div>

      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? "Creando…" : "Crear sesión"}
      </button>

      <p id="aviso-formulario" className={aviso ? "aviso" : ""} aria-live="polite">
        {aviso}
      </p>
    </form>
  );
}
