# Bike Garage 🚴

App web para ciclistas que quieren gestionar sus bicicletas, registrar componentes y controlar el peso de cada build.

---

## ¿Qué hace esta app? (para no devs)

Bike Garage es como un inventario digital para tus bicis. Con ella puedes:

- **Agregar tus bicicletas** — con nombre, tipo (gravel, MTB, ruta…), año, talla y notas
- **Registrar componentes** — cuadro, ruedas, frenos, transmisión, etc., con su peso en gramos
- **Ver el peso total** de cada bici calculado automáticamente
- **Ver la distribución de peso** por categoría (qué parte pesa más)
- **Buscar componentes** dentro de cada bici
- **Ver el historial de cambios** — qué componentes se agregaron, editaron o eliminaron
- **Gestionar categorías** — puedes ocultar las que no usas o agregar las tuyas
- **Iniciar sesión de forma segura** — cada usuario solo ve sus propias bicis

---

## Funcionalidades principales

| Funcionalidad | Descripción |
|---|---|
| Login / Registro | Autenticación por email y contraseña |
| Mi Garage | Lista de todas tus bicis con contador |
| Detalle de bici | Componentes, peso total y distribución por categoría |
| Agregar componente | Nombre, categoría y peso (opcional) |
| Editar componente | Edición inline directo en la lista |
| Historial | Registro de todos los cambios con fecha |
| Categorías | Gestión de categorías personalizadas |

---

## Stack tecnológico (para devs)

| Tecnología | Rol |
|---|---|
| [Next.js 15](https://nextjs.org/) | Framework de React para el frontend y routing |
| [React 19](https://react.dev/) | Librería de UI |
| [Supabase](https://supabase.com/) | Base de datos PostgreSQL + autenticación |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utilidades de estilos (usado parcialmente) |

---

## Estructura del proyecto

```
bike-garage/
├── app/
│   ├── (app)/                        # Rutas protegidas (requieren login)
│   │   ├── layout.js                 # Layout compartido de la app
│   │   ├── garage/
│   │   │   ├── page.js               # Lista de bicis del usuario
│   │   │   └── [bikeId]/
│   │   │       ├── page.js           # Detalle de una bici + componentes
│   │   │       └── history/
│   │   │           └── page.js       # Historial de cambios de la bici
│   │   └── settings/
│   │       └── categories/
│   │           └── page.js           # Gestión de categorías
│   ├── (auth)/                       # Rutas públicas (sin login)
│   │   ├── login/page.js             # Pantalla de inicio de sesión
│   │   └── signup/page.js            # Pantalla de registro
│   ├── layout.js                     # Layout raíz (fuentes, metadata global)
│   ├── page.js                       # Página de inicio (landing)
│   └── globals.css                   # Estilos globales
├── components/
│   ├── AppHeader.jsx                 # Barra de navegación superior
│   ├── PageShell.jsx                 # Contenedor general de página
│   ├── BackgroundGlow.jsx            # Efecto de fondo decorativo
│   ├── Button.js                     # Botón reutilizable
│   ├── Card.js                       # Tarjeta reutilizable
│   ├── EmptyState.js                 # Estado vacío reutilizable
│   ├── Input.js                      # Input reutilizable
│   └── Navbar.js                     # Navegación
├── lib/
│   ├── supabaseClient.js             # Conexión a Supabase
│   └── auth.js                       # Helpers de autenticación
└── public/                           # Archivos estáticos (íconos, imágenes)
```

---

## Tablas en Supabase

La app usa las siguientes tablas en la base de datos:

| Tabla | Para qué sirve |
|---|---|
| `bikes` | Almacena las bicicletas de cada usuario |
| `parts` | Componentes de cada bicicleta |
| `part_logs` | Historial de cambios en componentes |
| `categories` | Categorías personalizadas del usuario |
| `category_hidden` | Categorías que el usuario ocultó |

### Columnas principales

**`bikes`**
- `id` — identificador único
- `user_id` — a qué usuario pertenece
- `name` — nombre de la bici
- `type` — tipo (Gravel, MTB, Ruta…)
- `year` — año
- `size` — talla
- `notes` — notas libres
- `created_at` — fecha de creación

**`parts`**
- `id` — identificador único
- `bike_id` — a qué bici pertenece
- `user_id` — a qué usuario pertenece
- `name` — nombre del componente
- `category` — categoría (Drivetrain, Brakes…)
- `weight_g` — peso en gramos
- `created_at` — fecha de creación

---

## Cómo correr el proyecto localmente

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repo>
cd bike-garage
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con estas dos variables (las obtienes desde tu proyecto en [supabase.com](https://supabase.com)):

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Luego abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Scripts disponibles

| Comando | Acción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la versión de producción |
| `npm run start` | Corre la versión de producción |
| `npm run lint` | Revisa el código con ESLint |

---

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto en Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon key) de Supabase |

> ⚠️ Nunca subas el archivo `.env.local` a un repositorio público. Agrega `.env.local` a tu `.gitignore`.

---

## Categorías de componentes por defecto

La app incluye estas categorías predefinidas:

`Frame` · `Fork` · `Wheelset` · `Tires` · `Drivetrain` · `Brakes` · `Cockpit` · `Seat / Post` · `Accessories` · `Other`

Puedes agregar categorías propias o ocultar las que no uses desde **Ajustes → Categorías**.
