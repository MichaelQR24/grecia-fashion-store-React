# 🏛️ Grecia Fashion Store — Guía de Desarrollo

**Stack:** Next.js 16 (App Router + Turbopack) · Supabase · Stripe · React 19  
**Última actualización:** Marzo 2026

---

## 1. Requisitos Previos

| Herramienta | Versión mínima | Verificar instalación |
|---|---|---|
| **Node.js** | v20+ (LTS) | `node -v` |
| **npm** | v10+ | `npm -v` |
| **Stripe CLI** | v1.19+ | `stripe --version` |
| **Git** | v2.40+ | `git --version` |

### Cuentas necesarias

- [**Supabase**](https://supabase.com) — Base de datos, autenticación y storage
- [**Stripe**](https://stripe.com) — Procesamiento de pagos
- [**Vercel**](https://vercel.com) *(opcional)* — Despliegue a producción

### Instalar Stripe CLI

```bash
# Windows (Scoop)
scoop install stripe

# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Después de instalar, autenticar:
stripe login
```

---

## 2. Instalación del Proyecto

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/grecia-fashion-store-React.git
cd grecia-fashion-store-React

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
# (Si no existe .env.example, crear .env manualmente — ver sección siguiente)
```

---

## 3. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ═══════════════════════════════════════════════════
# SUPABASE
# ═══════════════════════════════════════════════════
# Encontrar en: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# Service Role Key (NUNCA exponer en el frontend)
# Encontrar en: Supabase Dashboard → Settings → API → service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# ═══════════════════════════════════════════════════
# STRIPE
# ═══════════════════════════════════════════════════
# Encontrar en: Stripe Dashboard → Developers → API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Webhook Secret — se genera al ejecutar `stripe listen` (ver sección 4)
# Copiar el valor whsec_... que aparece en la terminal
STRIPE_WEBHOOK_SECRET=whsec_...
```

> ⚠️ **IMPORTANTE:** Nunca subas el archivo `.env` a Git. Verifica que `.gitignore` incluya `.env`.

### Tabla de referencia rápida

| Variable | Prefijo público | Dónde se usa |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sí | Cliente + Servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sí | Cliente + Servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | Solo Webhook (bypass RLS) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Sí | Cliente (Stripe.js) |
| `STRIPE_SECRET_KEY` | ❌ No | Solo API Routes del servidor |
| `STRIPE_WEBHOOK_SECRET` | ❌ No | Solo Webhook de Stripe |

---

## 4. Flujo de Inicio Diario

Necesitas **2 terminales** corriendo simultáneamente:

### Terminal 1 — Servidor de Desarrollo

```bash
npm run dev
```

Verás:
```
▲ Next.js 16.2.1 (Turbopack)
- Local:   http://localhost:3000
✓ Ready in ~600ms
```

### Terminal 2 — Túnel de Webhooks de Stripe

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Verás:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

> 📋 **Primera vez:** Copia el valor `whsec_...` y pégalo en tu `.env` como `STRIPE_WEBHOOK_SECRET`. Luego **reinicia el servidor** (Terminal 1).

### Diagrama del flujo

```
┌──────────────┐     ┌───────────────┐     ┌────────────────────┐
│   Browser    │────▶│  Next.js API  │────▶│  Stripe Servers    │
│ localhost:3K │     │  /checkout    │     │  (crea sesión)     │
└──────────────┘     └───────────────┘     └────────┬───────────┘
                                                    │
                     ┌───────────────┐              │ webhook event
                     │  Stripe CLI   │◀─────────────┘
                     │  (túnel)      │
                     └───────┬───────┘
                             │ forward
                     ┌───────▼───────┐     ┌────────────────────┐
                     │  Next.js API  │────▶│  Supabase          │
                     │  /webhooks    │     │  (guarda orden)    │
                     └───────────────┘     └────────────────────┘
```

---

## 5. Guía de Pruebas de Compra

### Paso a paso

1. **Abre** `http://localhost:3000` en el navegador
2. **Inicia sesión** con tu cuenta de prueba
3. **Añade productos** al carrito desde la tienda
4. **Acepta** los Términos y Condiciones en el carrito
5. **Haz clic** en "Pagar Seguro con Stripe"
6. En la página de Stripe Checkout, usa la tarjeta de prueba:

```
Número:     4242 4242 4242 4242
Expiración: 12/30 (cualquier fecha futura)
CVC:        123
Nombre:     Cualquier nombre
```

7. Completa el pago

### Verificar que todo funcionó

**En la Terminal 2 (Stripe CLI):**
```
2026-03-29 16:50:00   --> checkout.session.completed [evt_xxx]
2026-03-29 16:50:01  <--  [200] POST http://localhost:3000/api/webhooks/stripe
```

**En la Terminal 1 (Servidor Next.js):**
```
📩 Webhook recibido: checkout.session.completed
🔍 Procesando sesión: cs_test_XXXX
👤 userId resuelto: abc123-user-uuid
📦 Item: Jean Push Up x1 @ $45.00
📝 Payload de orden a insertar: {...}
✅ Orden xyz registrada con éxito vía Webhook.
```

**En Supabase Dashboard:**
- Ve a `Table Editor → orders` — deberías ver la nueva fila

**En la App:**
- Ve a `/user` (perfil) — la orden aparece en "Mis Pedidos Recientes"
- Si eres admin, ve a `/admin` → pestaña "Pedidos" — la orden aparece ahí también

---

## 6. Troubleshooting (Solución de Problemas)

### ❌ Stripe CLI da error de WebSocket

```
Error: websocket: bad handshake
```

**Solución:**
```bash
# 1. Re-autenticar
stripe login

# 2. Si persiste, reiniciar la sesión CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe --latest
```

Si estás detrás de un proxy/VPN corporativo, puede bloquear WebSockets. Prueba desactivarlo temporalmente.

---

### ❌ `STRIPE_WEBHOOK_SECRET` cambió

Stripe CLI genera un nuevo `whsec_...` cada vez que ejecutas `stripe listen`. Si cerraste y reabriste el CLI:

```bash
# 1. Ejecutar stripe listen de nuevo
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 2. Copiar el NUEVO whsec_... de la terminal

# 3. Actualizar .env
STRIPE_WEBHOOK_SECRET=whsec_NUEVO_VALOR_AQUI

# 4. REINICIAR el servidor Next.js (Ctrl+C → npm run dev)
```

> ⚠️ Si no reinicias el servidor, Next.js seguirá usando el secret viejo y TODOS los webhooks fallarán con `Webhook signature verification failed`.

---

### ❌ Cambié el `.env` pero no toma efecto

Next.js **no recarga automáticamente** las variables de entorno en caliente. Debes:

```bash
# Ctrl+C para detener el servidor
# Luego reiniciar
npm run dev
```

---

### ❌ La orden no aparece en Supabase

Revisa en orden:

1. **¿Stripe CLI está corriendo?** → Terminal 2 debe mostrar eventos
2. **¿El webhook respondió 200?** → Busca `[200] POST` en la Terminal 2
3. **¿Hay error en los logs?** → Busca `❌` en la Terminal 1
4. **¿Los columnas coinciden?** → Verifica en Supabase que la tabla `orders` tenga: `user_id`, `stripe_session_id`, `total_amount`, `cart_items`, `status`, `customer_name`, `customer_email`, `customer_phone`
5. **¿RLS bloquea?** → El webhook usa `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS. Verifica que la variable esté definida en `.env`

---

### ❌ Error `Module not found` o dependencias rotas

```bash
# Limpiar todo y reinstalar
rm -rf node_modules .next
npm install
npm run dev
```

---

## 7. Comandos Útiles

### Desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (requiere build) |
| `npm run lint` | Verificar errores de ESLint |
| `npx tsc --noEmit` | Verificar errores de TypeScript |

### Stripe CLI

| Comando | Descripción |
|---|---|
| `stripe login` | Autenticar con tu cuenta Stripe |
| `stripe listen --forward-to localhost:3000/api/webhooks/stripe` | Túnel de webhooks |
| `stripe trigger checkout.session.completed` | Disparar evento de prueba |
| `stripe logs tail` | Ver logs en tiempo real |

### Limpieza y Mantenimiento

```bash
# Limpiar caché de Next.js
rm -rf .next

# Reinstalar dependencias desde cero
rm -rf node_modules package-lock.json
npm install

# Verificar TypeScript sin compilar
npx tsc --noEmit --pretty
```

---

## 8. Estructura del Proyecto (Resumen)

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Login con rate limiting
│   │   ├── checkout_sessions/ # Crea sesión de Stripe
│   │   ├── coupons/           # CRUD de cupones (admin)
│   │   ├── products/          # CRUD de productos
│   │   ├── upload/            # Subida de imágenes
│   │   └── webhooks/stripe/   # Recibe eventos de pago
│   ├── admin/                 # Panel de administración
│   ├── user/                  # Perfil del cliente
│   └── layout.tsx             # Layout global (CSP, fonts)
├── components/
│   ├── cart/                  # Carrito de compras
│   ├── home/                  # Hero, Store, Categories...
│   └── layout/                # Header, Footer
├── lib/
│   ├── permissions.ts         # isAdmin() via user_metadata
│   ├── rateLimit.ts           # Rate limiter en memoria
│   └── supabase.ts            # Cliente público (anon key)
├── store/                     # Zustand (auth, cart, products)
├── types/                     # Interfaces TypeScript
└── utils/
    └── supabase/              # Clientes SSR (server/client)
```

---

## 9. Despliegue a Producción (Vercel)

1. Conecta el repo a [Vercel](https://vercel.com)
2. Configura las variables de entorno en **Vercel Dashboard → Settings → Environment Variables**
3. En Stripe Dashboard → Developers → Webhooks:
   - Añade un nuevo endpoint: `https://tu-dominio.vercel.app/api/webhooks/stripe`
   - Selecciona el evento: `checkout.session.completed`
   - Copia el **Signing Secret** de producción y úsalo como `STRIPE_WEBHOOK_SECRET` en Vercel

> ⚠️ En producción, el `STRIPE_WEBHOOK_SECRET` es **diferente** al de desarrollo (CLI). Usa el que te da el Dashboard de Stripe, no el del CLI.

---

*Documento creado como parte de la Auditoría de Seguridad y Hardening del proyecto. Marzo 2026.*
