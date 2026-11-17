# 30 · Control de asistencia con QR y ubicación

Aplicación web de una sola pieza (Next.js 16 + React 19 + TypeScript) para tomar asistencia sin papel: el docente abre una sesión, proyecta un QR que **cambia cada 30 s** y cada estudiante registra su asistencia validando **firma del token, vigencia, ventana de tiempo, distancia y unicidad**.

- Interfaz: App Router, mobile-first, accesible (landmarks, un `h1` por página, foco visible, `aria-live`, `prefers-color-scheme` y `prefers-reduced-motion`).
- API: Route Handlers con capas **ruta → servicio → repositorio**, Zod estricto y un envoltorio común de errores.
- Datos: repositorios **en memoria** (singletons en `globalThis`), inyectables en pruebas.

## Requisitos

- Node.js 22 o superior (probado con Node 24).
- npm.

## Puesta en marcha

```bash
npm install
# .env.local (no se versiona):
#   AUTH_DEV=1
#   QR_SECRET=<cadena aleatoria de al menos 16 caracteres>
npm run dev
```

Abre <http://localhost:3000>. Variables disponibles en `.env.example` (sin valores reales).

### Probar el flujo con dos cuentas dev

1. Entra en `/login` con usuario `docente1` y rol **Docente**. El token `dev.docente1.docente` queda en `sessionStorage`.
2. Ve a **Inicio → Abrir una sesión nueva**, define curso, coordenadas (botón «Usar mi ubicación» o a mano), radio y ventana de tiempo.
3. En la página de la sesión verás el QR rotativo, el enlace de respaldo y la lista de asistentes (5 s).
4. Abre una ventana privada, entra en `/login` como `estudiante1` (rol **Estudiante**), escanea el QR o abre el enlace `/asistir/<token>` y pulsa «Usar mi ubicación y registrar».
5. Vuelve a la ventana del docente: el estudiante aparece en la lista. «Exportar asistentes (CSV)» descarga el archivo.

> El login es **de desarrollo**: no hay contraseña ni Firebase. Nunca se despliega así.

## Arquitectura por capas

```
src/app/**            Rutas y páginas (servidor por defecto; "use client" con estado/efectos)
src/app/api/**        Route Handlers → validan con Zod y delegan
src/services/**       Reglas de negocio puras (token, distancia, registro)
src/repositories/**   Persistencia (en memoria; sustituible por Firestore)
src/schemas/**        Esquemas Zod compartidos cliente/servidor
src/lib/**            errores, auth, http, config, csv, cliente HTTP
src/hooks/**          useCountdown, usePolling, usePaginaVisible
```

Reglas: el `uid` y el rol salen **siempre** del token verificado; el cliente nunca los envía. Los servicios no leen `process.env`.

## Endpoints

| Método | Ruta | Rol | Éxito | Errores |
|---|---|---|---|---|
| GET | `/api/auth/yo` | cualquiera | 200 `{ usuario }` | 401 |
| POST | `/api/sesiones` | docente | 201 sesión | 400, 401, 403, 500 |
| GET | `/api/sesiones` | docente | 200 `{ sesiones }` | 401, 403 |
| GET | `/api/sesiones/{id}/qr` | docente dueño | 200 `{ token, expiraEnMs }` | 401, 403, 404 |
| GET | `/api/sesiones/{id}/asistentes` | docente dueño | 200 `{ asistentes }` | 401, 403, 404 |
| GET | `/api/sesiones/{id}/exportar` | docente dueño | 200 `text/csv` | 401, 403, 404 |
| POST | `/api/asistencias` | estudiante | 201 `{ distanciaM, registradaEn }` | 400, 401, 403, 404, 409, 410, 422 |
| GET | `/api/asistencias/mias` | estudiante | 200 `{ asistencias }` | 401, 403 |

Error estándar: `{ "error": "mensaje", "detalles"?: [{ "campo", "mensaje" }] }`. Todas las respuestas privadas llevan `Cache-Control: no-store`.

## Pruebas y verificación

```bash
npm run check   # eslint + tsc --noEmit + vitest (37 pruebas)
npm run build
```

- Lógica pura: HMAC del token (9), haversine (3), registro de asistencia (6).
- API: 11 pruebas sobre los handlers exportados con `new Request(...)`.
- Componentes: 5 pruebas con Testing Library (formulario, lista, asistencia).
- Integración: docente crea sesión → pide QR → estudiante registra → lista con un asistente.

## Alcance y pendientes (honesto)

- **Repositorios en memoria**, no Firestore: el proyecto se centra en la lógica y la API. Al reiniciar se pierden sesiones y asistencias. La interfaz `RepositorioSesiones`/`RepositorioAsistencias` permite sustituirlos por Firestore sin tocar servicios ni rutas.
- **Login de desarrollo**, no Firebase Auth: se usa `dev.<uid>.<rol>` con `AUTH_DEV=1`. El verificador real (Firebase `verifyIdToken`/`verifySessionCookie`) está marcado con `TODO` en `src/lib/auth.ts`; la comprobación de `Origin` y el `uid` desde el token ya están implementados.
- **Sin despliegue en Vercel**: no hay URL de producción ni variables configuradas.
- **Sin rate limiting** (429): no implementado; el contrato de error lo admite.
- **Sin evidencias de Lighthouse, axe ni capturas** de 360/768/1024: no se midieron (ver `CALIDAD.md`).
- `cacheComponents` está desactivado porque no admite `runtime = "nodejs"` en los handlers.
