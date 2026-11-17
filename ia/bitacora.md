$c = @'
# Bitácora de IA — 30 · Control de asistencia con QR y ubicación

Registro de cada uso relevante de la IA en el proyecto. Una fila por intervención.

| fecha | propósito | evidencia | validación | decisión |
|---|---|---|---|---|
| 2026-11-16 | Configurar el agente qr-docente (workspaceOnly, exec=ask) y probar restricciones | `ia/pruebas-restricciones.md` | Pruebas a y c: bloqueo real observado en la TUI. Pruebas b y d: las documenté yo como operador. Ejecuté `git ls-files`: solo `.env.example` versionado | Se aceptó: secretos fuera del repo; el shell depende de aprobación humana |
| 2026-11-16 | Implementar token QR firmado, haversine y registro de asistencia con pruebas | `src/services/*`, `tests/*.test.ts` | Ejecuté `npm run check`: 37/37 tests en verde. Orden: token → 404 → 409 SESION_CERRADA → 422 → 409 DUPLICADO | Se aceptó tolerancia ±2 intervalos (±1 minuto, según el documento) |
| 2026-11-16 | Construir la API REST por capas con repositorios en memoria | `src/app/api/**`, `src/lib/*` | Ejecuté `npm run check` en verde. Sin `AUTH_DEV` el verificador rechaza todo | Se aceptó: uid/rol desde el token, Zod estricto, CSV con escape de fórmulas |
| 2026-11-16 | Añadir la dependencia `qrcode` | `package.json`, `src/types/qrcode.d.ts` | Ejecuté `npm run build`: pasa | Se aceptó `qrcode` con tipos locales |
| 2026-11-16 | Construir la interfaz del docente y del estudiante | `src/app/**`, `src/components/**`, `src/hooks/**` | Ejecuté `npm run check` (37 tests) y `npm run build`. No medí Lighthouse ni axe (ver `CALIDAD.md`) | Se aceptó; alcance honesto en `CALIDAD.md` |
| 2026-11-16 | Redactar README, OpenAPI, colección Bruno y CALIDAD | `README.md`, `openapi.yaml`, `bruno/`, `CALIDAD.md` | Ejecuté `git grep` sobre bruno/, README y openapi.yaml: sin contraseñas ni claves | Se aceptó: memoria, login dev, sin Vercel |

## Reglas de la bitácora
- Toda intervención de IA que produzca código, configuración o decisiones queda registrada.
- La evidencia debe poder reproducirse (ruta de archivo, comando, salida o captura).
- "Validación" es lo que se ejecutó de verdad, no lo que se supone.
- Si la IA propuso algo que se rechazó, se registra también.
'@
[System.IO.File]::WriteAllText("$PWD\ia\bitacora.md", $c, (New-Object System.Text.UTF8Encoding($false)))
git diff --stat
Select-String -Path ia\bitacora.md -Pattern "Ã"