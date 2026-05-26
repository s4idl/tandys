<div align="center">

<img src="mercadito-front/src/assets/tandyslogo.png" alt="Tandys Logo" width="120" />

# 🌟 Tandys — Mercadito Digital

**Plataforma interactiva para la gestión de espacios en mercaditos artesanales y pop-up markets.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

</div>

---

## 📖 ¿Qué es Tandys?

**Tandys** es una plataforma web full-stack que digitaliza la experiencia de los mercaditos y pop-up markets. Los emprendedores pueden explorar el mapa interactivo del mercado, descubrir las marcas presentes en cada local, registrar su propia marca y solicitar un espacio — todo sin salir de la app.

Los administradores, por su parte, tienen un panel completo para gestionar espacios, aprobar solicitudes, verificar pagos y configurar el mercadito.

---

## ✨ Características principales

| Módulo | Descripción |
|---|---|
| 🗺️ **Mapa interactivo** | Canvas con Konva que muestra todos los espacios del mercadito en tiempo real (disponible, ocupado, solicitado) |
| 🏪 **Popover de marcas** | Al hacer clic en un espacio ocupado aparece un card con nombre, logo, descripción y redes sociales |
| ✍️ **Registro de marcas** | Wizard de 4 pasos: Identidad → Historia → Redes → Confirmación |
| 📋 **Solicitudes de espacio** | Sistema de solicitudes con flujo pendiente → aceptada/rechazada |
| 💳 **Pagos** | Upload de comprobantes (transferencia / depósito) con verificación por admin |
| 👤 **Perfil de usuario** | Datos de cuenta, marcas registradas y gestión de soporte |
| 🛡️ **Panel Admin** | Dashboard con métricas, gestión de espacios, solicitudes y ajustes del mercadito |
| ❓ **FAQ** | Preguntas frecuentes gestionadas desde el panel admin |

---

## 🏗️ Arquitectura

```
tandys/
├── mercadito-front/     # Cliente React + Vite + TypeScript
│   ├── src/
│   │   ├── features/    # Módulos principales (auth, map, ui)
│   │   ├── pages/       # Páginas de la app
│   │   ├── services/    # Axios API client
│   │   ├── store/       # Estado global con Zustand
│   │   └── types/       # Tipos TypeScript compartidos
│   └── ...
│
└── mercadito-back/      # API REST NestJS + Prisma + PostgreSQL
    ├── src/
    │   ├── auth/        # JWT + Passport (login, registro)
    │   ├── marcas/      # CRUD de marcas de vendedores
    │   ├── espacios/    # Gestión de locales del mercadito
    │   ├── solicitudes/ # Flujo de solicitud de espacios
    │   ├── pagos/       # Gestión y verificación de pagos
    │   ├── usuarios/    # Gestión de cuentas
    │   └── faq/         # Preguntas frecuentes
    └── prisma/          # Schema y migraciones de BD
```

---

## 🛠️ Stack tecnológico

### Frontend
- **React 19** + **TypeScript 5.9** — UI moderna con tipado estricto
- **Vite 8** — Build ultrarrápido
- **React Router 7** — Navegación SPA con rutas protegidas
- **Konva / React-Konva** — Canvas interactivo para el mapa del mercadito
- **Zustand** — Estado global minimalista (usuario, mapa, UI)
- **Lucide React** — Iconografía limpia y consistente
- **Supabase JS** — Almacenamiento de archivos (comprobantes de pago)

### Backend
- **NestJS 11** + **TypeScript** — API REST estructurada y escalable
- **Prisma 6** — ORM type-safe con migraciones
- **PostgreSQL** (hosteado en **Supabase**) — Base de datos relacional
- **Passport + JWT** — Autenticación stateless
- **Bcrypt** — Hash seguro de contraseñas
- **Class-validator / Class-transformer** — Validación de DTOs

---

## 🗄️ Modelo de datos

```
usuarios ──< marcas ──< solicitudes ──< pagos ──< comprobantes
               │              │
           (redes)        espacios ──< mercaditos
```

**Roles de usuario:** `visualizador` | `vendedor` | `admin`

**Estados de espacio:** `disponible` → `solicitado` → `pendiente_pago` → `ocupado`

**Flujo de solicitud:** `pendiente` → `aceptada` / `rechazada`

**Métodos de pago:** `transferencia` | `deposito`

---

## 🚀 Instalación y desarrollo local

### Prerrequisitos
- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL (o cuenta en Supabase)

### 1. Clonar el repo

```bash
git clone https://github.com/s4idl/tandys.git
cd tandys
```

### 2. Configurar el Backend

```bash
cd mercadito-back

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL, JWT_SECRET, SUPABASE_URL, etc.

# Generar el cliente de Prisma y aplicar el schema
npx prisma generate

# Iniciar en modo desarrollo
npm run start:dev
```

> El servidor arranca en `http://localhost:3000`

### 3. Configurar el Frontend

```bash
cd ../mercadito-front

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# Edita VITE_API_URL apuntando a tu backend

# Iniciar en modo desarrollo
npm run dev
```

> La app arranca en `http://localhost:5173`

---

## 🔐 Variables de entorno

### Backend (`mercadito-back/.env`)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
JWT_SECRET="tu_secreto_super_seguro"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_KEY="tu_anon_key"
PORT=3000
```

### Frontend (`mercadito-front/.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 🗺️ Rutas de la aplicación

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Mapa interactivo del mercadito |
| `/mi-marca` | Autenticado | Gestión de marcas del vendedor |
| `/solicitudes` | Autenticado | Mis solicitudes de espacio |
| `/pagos` | Autenticado | Historial y subida de comprobantes |
| `/perfil` | Autenticado | Datos personales y soporte |
| `/dashboard` | Admin | Métricas y resumen general |
| `/ajustes` | Admin | Configuración del mercadito y FAQs |

---

## 👥 Roles y permisos

### 👁️ Visualizador
- Explorar el mapa
- Ver marcas y sus redes sociales

### 🏪 Vendedor
- Todo lo anterior
- Registrar y editar su marca
- Solicitar y gestionar espacios
- Subir comprobantes de pago

### 🛡️ Administrador
- Todo lo anterior
- Aprobar/rechazar solicitudes
- Verificar pagos
- Gestionar espacios del mapa
- Configurar el mercadito
- Gestionar FAQ

---

## 📡 API endpoints principales

```
POST   /auth/register         Registro de nuevo usuario
POST   /auth/login            Inicio de sesión (retorna JWT)

GET    /marcas                Listar marcas del usuario
POST   /marcas                Crear nueva marca
PATCH  /marcas/:id            Editar marca
DELETE /marcas/:id            Eliminar marca

GET    /espacios              Listar espacios del mercadito
PATCH  /espacios/:id          Actualizar espacio (Admin)

POST   /solicitudes           Crear solicitud de espacio
GET    /solicitudes           Mis solicitudes
PATCH  /solicitudes/:id       Actualizar estado (Admin)

POST   /pagos                 Registrar pago
PATCH  /pagos/:id/verificar   Verificar pago (Admin)

GET    /faq                   Listar preguntas frecuentes
POST   /faq                   Crear FAQ (Admin)
```

---

## 🧪 Scripts útiles

### Backend

```bash
npm run start:dev      # Desarrollo con hot-reload
npm run build          # Build de producción
npm run test           # Unit tests
npm run test:e2e       # Tests end-to-end
npm run lint           # Linter
```

### Frontend

```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build de producción
npm run preview        # Preview del build
npm run lint           # Linter
```

---

## 📁 Estructura del Frontend (detallada)

```
src/
├── features/
│   ├── auth/          # AuthModal — Login y registro
│   ├── map/           # MarketMap (canvas Konva) + BrandPopover
│   └── ui/            # Navbar, RegisterBrandWizard, RequestModal
├── pages/
│   ├── home/          # Landing / mapa principal
│   ├── miMarca/       # Gestión de marcas del vendedor
│   ├── Solicitudes/   # Lista de solicitudes
│   ├── pagos/         # Historial de pagos
│   ├── perfil/        # Perfil de usuario
│   ├── soporte/       # Soporte / contacto
│   └── admin/         # Dashboard, Gestión y Ajustes
├── services/          # axios.ts — cliente HTTP con interceptors
├── store/
│   ├── userStore.ts   # Estado de autenticación y usuario
│   └── mapStore.ts    # Estado del mapa (espacio seleccionado, popover)
└── types/             # Tipos e interfaces compartidos
```

---

## 🤝 Contribución

1. Haz un fork del repo
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commitea tus cambios: `git commit -m 'feat: agrega nueva feature'`
4. Push a tu rama: `git push origin feature/nueva-feature`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y de uso interno para **Tandys**. Todos los derechos reservados.

---

<div align="center">

Hecho con ❤️ por el equipo de **Tandys**

*Conectando marcas con mercados*

</div>