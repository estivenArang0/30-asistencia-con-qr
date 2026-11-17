"use client";

import { useEffect, useRef } from "react";

/** Llama a `callback` cada `intervaloMs` mientras `activo` sea true. */
export function usePolling(
  callback: () => void | Promise<void>,
  intervaloMs: number,
  activo: boolean,
): void {
  const guardado = useRef(callback);

  useEffect(() => {
    guardado.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const ejecutar = () => {
      if (vivo) void guardado.current();
    };
    ejecutar();
    const id = setInterval(ejecutar, intervaloMs);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [intervaloMs, activo]);
}
