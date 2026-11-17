"use client";

import { useEffect, useState } from "react";

/** Cuenta atrás en segundos que se reinicia al llegar a cero. */
export function useCountdown(segundos: number, activo: boolean): number {
  const [restantes, setRestantes] = useState(segundos);

  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => {
      setRestantes((valor) => (valor <= 1 ? segundos : valor - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [segundos, activo]);

  return restantes;
}
