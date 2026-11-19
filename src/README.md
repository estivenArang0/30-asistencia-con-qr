# src/ — mapa de capas

| Carpeta | Responsabilidad |
|---|---|
| `app/` | Páginas y Route Handlers de Next (no se mueven). |
| `components/` | Presentación reutilizable. |
| `hooks/` | Hooks de cliente (presentación y HTTP). |
| `services/` | Reglas de negocio puras y testeables. |
| `repositories/` | Contratos en la raíz; `memoria/` y `firestore/` son implementaciones. |
| `schemas/` | Esquemas Zod compartidos. |
| `lib/` | Infraestructura: `firebase/`, `auth/`, `http/`, `utils/`. |
| `types/` | Declaraciones de tipos externas. |

Dirección de dependencias: `app → services → repositories`.

- Nadie importa desde `app/` salvo el propio `app/`.
- `services/` no conoce `components/`, `hooks/` ni `app/`.
- `repositories/` implementa los contratos y puede usar `lib/`.
- `lib/` es transversal y no depende de capas superiores.
