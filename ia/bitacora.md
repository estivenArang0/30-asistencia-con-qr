# Bitácora de IA — 30 · Control de asistencia con QR y ubicación

Registro de cada uso relevante de la IA en el proyecto. Una fila por intervención.

| fecha | propósito | evidencia | validación | decisión |
|---|---|---|---|---|
| AAAA-MM-DD | Qué se le pidió a la IA y para qué | Archivo, commit o captura que lo demuestra | Cómo se comprobó que el resultado era correcto (prueba, comando, revisión manual) | Qué se aceptó, cambió o descartó, y por qué |
|  |  |  |  |  |
| 2026-11-16 | Configurar el agente qr-docente (workspace real, `fs.workspaceOnly`, `exec=ask`) y probar restricciones | `ia/pruebas-restricciones.md`, commit 426bc31 |  | Se aceptó: secretos fuera del workspace; el shell depende de aprobación humana |
| 2026-11-16 | Implementar token QR firmado, haversine y registro de asistencia con pruebas | `src/services/*`, `tests/*.test.ts`, commits 7e6e32e y 6b1f04b |  | Se aceptó tolerancia ±2 intervalos y orden de validaciones 410/404/409/422 |
| 2026-11-16 | Construir la API REST por capas con repositorios en memoria | `src/app/api/**`, `src/lib/{auth,http,config,csv}.ts`, commits d403342 y c428c23 |  | Se aceptó: uid/rol desde el token, Zod estricto, CSV con escape de fórmulas |
| 2026-11-16 | Añadir la dependencia `qrcode` (dibujar el QR en el navegador) | `package.json`, `src/types/qrcode.d.ts`, commit b3fe2e0 |  | Se aceptó `qrcode` y una declaración de tipos local en vez de `@types/qrcode` |
| 2026-11-16 | Construir la interfaz del docente y del estudiante (App Router, hooks, formularios) | `src/app/**`, `src/components/**`, `src/hooks/**`, `tests/componentes.test.tsx`, commit b3fe2e0 |  | Se aceptó; se desactivó `cacheComponents` porque bloquea `runtime = "nodejs"` en los handlers |
| 2026-11-16 | Redactar README, OpenAPI, colección Bruno y CALIDAD | `README.md`, `openapi.yaml`, `bruno/`, `CALIDAD.md` |  | Se aceptó con alcance honesto: memoria, login dev, sin Vercel ni evidencias Lighthouse |

## Reglas de la bitácora
- Toda intervención de IA que produzca código, configuración o decisiones queda registrada.
- La evidencia debe poder reproducirse (ruta de archivo, comando, salida o captura).
- "Validación" es lo que se ejecutó de verdad, no lo que se supone.
- Si la IA propuso algo que se rechazó, se registra también: la decisión de descartarlo también es una decisión.
