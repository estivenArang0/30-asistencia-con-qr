<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — 30 · Control de asistencia con QR y ubicación

## Stack
Next.js 16 (App Router) · React 19 · TypeScript estricto · Firebase (Auth en el navegador, Admin SDK solo en el servidor) · Zod · Vitest + Testing Library · ESLint con jsx-a11y · despliegue en Vercel.

## Estructura
```
src/app/          rutas, layouts y Route Handlers (app/api/**)
src/components/   UI reutilizable y accesible
src/hooks/        hooks de cliente (useCountdown, usePolling, …)
src/schemas/      esquemas Zod compartidos cliente/servidor
src/services/     reglas de negocio puras y testeables
src/repositories/ único lugar que habla con Firestore
src/lib/          firebase (cliente/admin), auth, errores, http
tests/            pruebas Vitest
```

## Comandos
- `npm run dev` — desarrollo en http://localhost:3000
- `npm run build` / `npm start` — build y producción
- `npm run lint` · `npm run typecheck` (`tsc --noEmit`) · `npm run test` (`vitest run`)
- `npm run check` — lint + typecheck + test (obligatorio antes de dar algo por terminado)

## Reglas
- Capas: **ruta → servicio → repositorio**. La ruta valida con Zod y traduce a HTTP; el servicio tiene la lógica; el repositorio es el único que toca Firebase.
- Validación **Zod en el servidor** siempre (modo estricto, sin campos desconocidos); el cliente valida solo para dar feedback.
- El **navegador nunca importa `firebase/firestore`**: todo dato pasa por `/api`. Solo `firebase/auth` para el inicio de sesión.
- Secretos **fuera del repo**: `C:\Users\estiven\.secretos-qr\.env.local` (nunca en Git, nunca con prefijo `NEXT_PUBLIC_`). **Nunca** crear `.env*` dentro del proyecto; solo `.env.example` con placeholders; la configuración web de Firebase es lo único público.
- **Componentes de servidor por defecto**; `"use client"` solo con estado, efectos o eventos del navegador.
- HTML semántico (header/nav/main/footer, un `<h1>`, `<button>` para acciones y `<a>` para navegar) y **accesibilidad WCAG 2.2 AA**; nada de `<div onClick>`.
- Textos de la interfaz **en español**; fechas ISO 8601; importes en enteros.
- Errores de API `{ error, detalles? }` con códigos correctos; nunca exponer detalles internos.
- No agregar dependencias no pedidas; nunca `dangerouslySetInnerHTML` sin sanear.
