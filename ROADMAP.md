# Trayly — Roadmap

> Criterio de prioridad: primero lo que desbloquea el primer cliente piloto, después monetización, después escala.
> Actualizar este archivo al terminar cada tarea.

---

## ✅ Completado

### Web pública (trayly.com.ar/{slug})
- [x] Pantalla de bienvenida con elección Comer aquí / Para llevar
- [x] Menú digital por categorías con imágenes
- [x] Carrito con controles inline
- [x] Formulario de pedido (nombre, teléfono)
- [x] Métodos de pago: efectivo y transferencia con CBU/alias
- [x] Mapa con botón "Ver en Google Maps" para pedidos para llevar
- [x] Comprobante del pedido con número, items y total
- [x] Página de seguimiento en tiempo real con timeline de estados
- [x] Sheet "Mis pedidos" con historial en localStorage
- [x] QR de mesa pre-llena número de mesa automáticamente
- [x] SEO dinámico por restaurante (generateMetadata)
- [x] Logo y favicon dinámico por restaurante
- [x] Color de acento configurable por restaurante
- [x] PWA instalable en iPhone y Android

### Panel admin (admin.trayly.com.ar)
- [x] Login con JWT
- [x] Dashboard de pedidos: Nuevos / En cocina / Listos / Historial
- [x] Indicador visual Para llevar / En mesa por pedido
- [x] Auto-refresh cada 15 segundos + beep en pedido nuevo
- [x] Gestión de menú: categorías e items con imágenes (Cloudinary)
- [x] Config: WhatsApp, color primario, logo, CBU/alias, dirección, Maps
- [x] Generador de QR por mesa y QR general
- [x] Nav hamburguesa en mobile
- [x] PWA instalable

### Super panel
- [x] Login con rol superadmin
- [x] Dashboard con stats: restaurantes activos, total pedidos, MRR
- [x] Tabla de todos los restaurantes con estado activo/inactivo
- [x] Drawer de detalle por cliente (básico)
- [x] Crear nuevo restaurante
- [x] Activar/desactivar tenant
- [x] Dashboard de estado de servicios
- [x] Alertas por email si un servicio se cae

### Backend
- [x] Multi-tenant row-level (tenant_id en cada tabla)
- [x] Auth JWT con roles: owner, manager, superadmin
- [x] CRUD completo de menú
- [x] Pedidos con estados completos
- [x] Endpoints públicos de menú y seguimiento
- [x] QR generator
- [x] Subida de imágenes a Cloudinary
- [x] Notificaciones WhatsApp al dueño (CallMeBot)
- [x] Monitoreo interno cada 20 minutos con alertas por email
- [x] CORS configurado para todos los dominios

---

## 🔨 Bloque actual — Pulido pre-piloto

> Objetivo: dejar Trayly listo para el primer cliente real.

- [ ] Timestamps en hora Argentina en el panel admin (fix solo frontend, `toLocaleString` con `America/Argentina/Buenos_Aires`)
- [ ] Pulir drawer de detalle en super panel (datos del dueño, facturación, notas internas, links directos)
- [ ] Revisar y limpiar `requirements.txt` (problema detectado con Python 3.14)
- [ ] Smoke test completo del flujo: cliente hace pedido → dueño recibe WhatsApp → cambia estado → cliente ve seguimiento

---

## 📋 Próximos bloques

### Bloque — Comunicación con el cliente
- [ ] Investigar WhatsApp Business API (costo, requisitos, sandbox)
- [ ] Notificar al cliente cuando cambia el estado del pedido
- [ ] Definir qué estados disparan notificación (confirmed, ready)

### Bloque — Monetización
- [ ] Integrar MercadoPago para cobro de suscripciones
- [ ] Definir planes y precios (setup + mensual)
- [ ] Facturación automática o manual (decidir)
- [ ] Analytics de cobros en super panel: MRR histórico, churn

### Bloque — Infraestructura
- [ ] Automatizar migraciones de Neon en el proceso de deploy
- [ ] Mover super panel a `super.trayly.com.ar`
- [ ] Evaluar upgrade de free tiers cuando haya clientes pagos

### Bloque — Escala (post primeros clientes)
- [ ] Dominio personalizado por cliente (ej: menu.restaurante.com)
- [ ] App mobile nativa (evaluar si la PWA alcanza)
- [ ] Reportes de ventas exportables por el dueño

---

## 🚫 Descartado / en pausa

- **Toggle claro/oscuro**: se intentó, quedó mal visualmente. Modo oscuro fijo.
- **CallMeBot para notificar al cliente**: requiere que el cliente active el bot previamente. Descartado.
- **Swagger en producción**: desactivado por seguridad. No reactivar.
- **Docker en desarrollo**: problemas con asyncpg en WSL2. PostgreSQL directo en Windows.
