# Trayly — Contexto para Claude Code

## Qué es este proyecto
SaaS multi-tenant para restaurantes en Argentina. Menú digital + pedidos online + panel admin.
Cada restaurante es un tenant separado por `tenant_id`. Un solo deploy sirve a todos.

URL pública: `trayly.com.ar/{slug}`
Panel admin: `admin.trayly.com.ar`
Super panel: `restaurante-saas-super.vercel.app`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12 + FastAPI + SQLAlchemy async + Alembic |
| DB dev | PostgreSQL local — Windows, puerto 5433 |
| DB prod | Neon.tech (PostgreSQL serverless) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Frontend | Next.js 16 + Tailwind v4 + TypeScript (PWA) |
| HTTP client | Axios |
| Imágenes | Cloudinary |
| QR | qrcode[pil] |
| WhatsApp | CallMeBot API |
| Email | Resend |
| Deploy backend | Railway |
| Deploy frontend | Vercel |
| Dominio | trayly.com.ar (Donweb) |

---

## Estructura de repositorios

```
trayly-backend/          # FastAPI
trayly-web/              # Next.js — web pública (trayly.com.ar/{slug})
trayly-admin/            # Next.js — panel admin (admin.trayly.com.ar)
trayly-super/            # Next.js — super panel (superadmin)
```

---

## Decisiones técnicas — NO cambiar sin discutir

- **Multi-tenant row-level**: `tenant_id` en cada tabla. No hay schemas separados.
- **Sin Docker en dev**: PostgreSQL instalado directo en Windows (asyncpg + WSL2 da problemas).
- **Migraciones a Neon**: Alembic no detecta bien el estado de Neon. Usar `fix_enum.py` o `ALTER TABLE` directo con psycopg2.
- **CSS inline con variables**: No usar clases Tailwind en componentes — usar `style={{ }}` con CSS variables. Tailwind v4 tiene incompatibilidades.
- **Tipografía fija**: Syne (títulos, números, botones) + Inter (body, labels, inputs). No cambiar.
- **Modo oscuro fijo**: No implementar toggle claro/oscuro — el modo claro se intentó y quedó mal.
- **Historial en localStorage**: El cliente no tiene login. Historial de pedidos vive en el browser.
- **Swagger deshabilitado en prod**: No reactivar. La API no expone docs públicamente.
- **CallMeBot solo al dueño**: Las notificaciones al cliente por CallMeBot están descartadas (requieren que el cliente active el bot).

---

## Convenciones de código

- **Commits**: Conventional commits — `feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `perf:`, `docs:`
- **Commits automáticos**: Al final de cada tarea, hacer commit con mensaje incluido en el prompt.
- **Variables de entorno**: `.env` no se commitea. Railway y Vercel tienen sus propias vars.
- **`fix_enum.py`**: Archivo temporal en `backend/` para migraciones manuales a Neon.

---

## Estados de pedido

```
pending → confirmed → preparing → ready → delivered
                                        → cancelled
```

---

## Roles

- `superadmin` — acceso total, gestión de tenants
- `owner` — dueño del restaurante
- `manager` — gestión operativa del restaurante

---

## Servicios externos — free tiers activos

| Servicio | Límite | Uso |
|----------|--------|-----|
| Neon.tech | Free tier | DB prod |
| Cloudinary | 25 GB | Imágenes |
| CallMeBot | Gratis | WhatsApp al dueño |
| Resend | 100 emails/día | Alertas |
| Railway | Free tier | Backend |
| Vercel | Free tier | Frontends |

---

## Lo que está pendiente (no tocar sin instrucción explícita)

- WhatsApp al cliente cuando cambia estado (CallMeBot descartado, pendiente WhatsApp Business API)
- Zona horaria Argentina en timestamps — pytz causó errores aware/naive, fix pendiente solo en frontend
- Drawer de detalle en super panel — incompleto
- Analytics de cobros (MRR histórico, churn)
- MercadoPago — después del primer piloto
- Dominio personalizado por cliente
- Automatizar migraciones de Neon en deploy
- Mover super panel a `super.trayly.com.ar`

---

## Reglas de trabajo — siempre aplicar

Al terminar CUALQUIER tarea:
1. Marcá la tarea como completada en ROADMAP.md ([ ] → [x])
2. Commiteá ROADMAP.md junto con los cambios del código
3. El mensaje de commit debe seguir conventional commits

No preguntes si hacerlo. Hacelo siempre.