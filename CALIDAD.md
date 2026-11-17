# CALIDAD.md — qué se midió y qué no

Fecha de estas comprobaciones: **2026-11-16** (America/Bogota). Todo lo de abajo se ejecutó en local
(Windows 11, Node 24). Lo que no se midió aparece explícitamente como **no medido**: no hay cifras inventadas.

## Verificación automática

| Comprobación | Comando | Resultado |
|---|---|---|
| Lint + tipos + pruebas | `npm run check` | **VERDE**: ESLint sin errores ni avisos, `tsc --noEmit` limpio, Vitest **6 archivos / 37 pruebas** en 7,0 s |
| Build de producción | `npm run build` | **OK**: compilado y tipado; 8 rutas API dinámicas, 3 páginas dinámicas, 2 estáticas |
| Auditoría de dependencias | `npm audit --omit=dev` | **4 vulnerabilidades altas** en la cadena `firebase` → `@firebase/firestore(-compat)`; no se aplicó `--force`. `firebase` está instalado pero hoy no se importa en el runtime de la app (login es de desarrollo) |
| Flujo funcional | script contra `next dev` en `:3100` | 201 crear sesión → 200 QR → 201 registro → 200 lista (1) → 200 historial (1) → 200 página `/asistir/<token>` |

## Revisión manual de estructura (inspección de código, no herramienta)

- `lang="es"` en `<html>`; enlace «Saltar al contenido» como primer elemento; `<header>`, `<nav aria-label="Principal">`, `<main id="contenido">`, `<footer>`.
- Un solo `<h1>` por página (`/`, `/login`, `/docente/sesiones/nueva`, `/docente/sesiones/[id]`, `/asistir/[token]`, `/historial`, 404 y error propios).
- Formularios con `<label for>` + `aria-describedby` en errores + `aria-invalid`; el aviso del formulario usa `aria-live="polite"`.
- Sin `<div onClick>`: todas las acciones son `<button>` y la navegación usa `<Link>`.
- Foco visible global con `:focus-visible` (outline de 3 px).
- `prefers-color-scheme` (temas claro/oscuro) y `prefers-reduced-motion` (anima solo el esqueleto) en `globals.css`.
- Responsive con `width: min(100% - 2rem, 68rem)`, rejillas de 1/2/3 columnas por `min-width` y tabla que pasa a bloques por debajo de 30 rem; sin anchos fijos en píxeles en el layout.
- Metas táctiles: botones y enlaces de navegación con `min-height: 44px`.

## No medido (declarado, no estimado)

- **Lighthouse** (rendimiento, accesibilidad, buenas prácticas, SEO): no ejecutado.
- **axe DevTools / validador HTML del W3C**: no ejecutados.
- **Capturas 360 / 768 / 1024 px** y pruebas en teléfono real: no realizadas.
- **Lector de pantalla** (NVDA/VoiceOver) y recorrido completo solo con teclado: no realizados.
- **LCP, INP, CLS**, presupuesto de JavaScript transferido: no medidos.
- **Despliegue en Vercel**: no existe; no hay URL de producción.

## Cómo reproducir lo que sí se midió

```bash
cd 30-asistencia-con-qr
npm run check
npm run build
npm audit --omit=dev
```
