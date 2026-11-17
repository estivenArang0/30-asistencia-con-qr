"use client";

import { useEffect, useState } from "react";

/** Page Visibility API: pausa el trabajo cuando la pestaña no se ve. */
export function usePaginaVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const actualizar = () => setVisible(document.visibilityState === "visible");
    actualizar();
    document.addEventListener("visibilitychange", actualizar);
    return () => document.removeEventListener("visibilitychange", actualizar);
  }, []);

  return visible;
}
