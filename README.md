# SIGEP II — Sistema de Gestión de Empleo Público

> Réplica académica del módulo de **Hoja de Vida** del **SIGEP II** del Departamento Administrativo de la Función Pública (DAFP) de Colombia.
>
> Universidad Autónoma de Occidente — Facultad de Ingeniería — Proyecto Informático.

---

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Arquitectura](#arquitectura)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Historias de Usuario](#historias-de-usuario)
5. [Stack tecnológico](#stack-tecnológico)
6. [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
7. [Variables de entorno](#variables-de-entorno)
8. [Documentación OpenAPI](#documentación-openapi)
9. [Endpoints disponibles](#endpoints-disponibles)
10. [Convenciones del proyecto](#convenciones-del-proyecto)
11. [Problemas resueltos durante el desarrollo](#problemas-resueltos-durante-el-desarrollo)
12. [Observaciones pendientes](#observaciones-pendientes-roadmap)
13. [Equipo](#equipo)

---

## Descripción

SIGEP II es un sistema web que permite:

- **Servidores públicos**: registrar y mantener su hoja de vida (datos personales, formación, experiencia laboral, sección de gerencia pública), adjuntar soportes en PDF/JPG y descargar la HV completa en PDF.
- **Jefes de Talento Humano (JTH)**: crear las credenciales iniciales de servidores, inhabilitar roles al momento de retiro y validar/desbloquear cada sección de la HV.

El sistema implementa autenticación por JWT con refresh tokens, rate-limiting, bloqueo automático tras intentos fallidos, recuperación de contraseña por correo, y auditoría completa de operaciones críticas.

---

## Arquitectura

**Patrón**: Monolito **MVC** (Model-View-Controller) — no microservicios.

```
┌────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                      │
│  Pages  ──►  Services (axios)  ──►  Auth Store (Zustand)   │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTP/JSON
                           ▼
┌────────────────────────────────────────────────────────────┐
│                       BACKEND (Express)                     │
│                                                             │
│  Routes  ──►  Middlewares (auth, validators, rate-limit)   │
│     │                                                       │
│     ▼                                                       │
│  Controllers  ──►  Services (lógica de negocio)            │
│                         │                                   │
│                         ▼                                   │
│                    Database (SQLite)                        │
│                                                             │
│  Swagger UI  ◄──  swagger-jsdoc  ──►  docs/openapi/*.js    │
└────────────────────────────────────────────────────────────┘
```

**Principios aplicados**:
- Separación estricta de responsabilidades (route → controller → service).
- Validación en frontend (UX) y backend (seguridad).
- Documentación viva (OpenAPI generada desde el código).
- Clean code: nombres claros, funciones pequeñas, DRY.

---

## Estructura del proyecto

```
SIGED-2/
├── .gitignore                          # Patrones ignorados (node_modules, .env, build, BD)
├── README.md                           # Este archivo
│
├── backend/
│   ├── .env.example                    # Plantilla de variables de entorno
│   ├── package.json
│   ├── database/
│   │   └── sigep2.db                   # SQLite (NO versionada)
│   └── src/
│       ├── app.js                      # Punto de entrada (Express + middlewares + rutas)
│       ├── config/
│       │   ├── database.js             # Inicialización SQLite (sql.js)
│       │   ├── logger.js               # Winston
│       │   └── swagger.js              # OpenAPI spec (schemas + responses + servers)
│       ├── controllers/                # Reciben req, llaman al service, devuelven res
│       │   ├── authController.js
│       │   └── cvController.js
│       ├── services/                   # Lógica de negocio, transacciones BD
│       │   ├── authService.js
│       │   ├── cvService.js
│       │   ├── cvExportService.js      # Generación PDF (pdfkit)
│       │   └── emailService.js         # Nodemailer
│       ├── routes/                     # Definición de endpoints (limpio, sin docs)
│       │   ├── authRoutes.js
│       │   ├── cvRoutes.js
│       │   └── userRoutes.js
│       ├── middlewares/
│       │   ├── auth.js                 # authenticate (JWT) + authorize (roles)
│       │   └── errorHandler.js
│       ├── database/
│       │   ├── migrate.js              # Crea tablas
│       │   └── seed.js                 # Crea admin y datos base
│       └── docs/
│           └── openapi/                # Anotaciones @openapi (JSDoc puro)
│               ├── auth.docs.js
│               └── cv.docs.js
│
└── frontend/
    ├── package.json
    ├── public/
    └── src/
        ├── App.jsx                     # Router principal
        ├── index.js
        ├── components/
        │   └── shared/
        │       └── ProtectedRoute.jsx  # Guard de rutas por rol
        ├── context/
        │   └── authStore.js            # Estado global (Zustand)
        ├── pages/
        │   ├── public/                 # Páginas sin auth
        │   │   ├── PublicLayout.jsx
        │   │   ├── InicioPage.jsx
        │   │   └── InstructivosPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RecoverPasswordPage.jsx
        │   ├── ResetPasswordPage.jsx
        │   ├── ChangePasswordPage.jsx
        │   ├── DashboardLayout.jsx     # Layout autenticado con sidebar
        │   ├── HojaVidaPage.jsx        # Formulario HV (3 pestañas)
        │   └── UserManagementPage.jsx  # JTH/ADMIN
        └── services/
            ├── api.js                  # Cliente axios con interceptor JWT
            ├── authService.js
            └── cvService.js
```

---

## Historias de Usuario

### Módulo 1 — Autenticación y Acceso

| HU | Descripción | Endpoint principal |
|----|-------------|--------------------|
| HU-001 | Iniciar sesión con tipo + número de documento | `POST /api/auth/login` |
| HU-002 | Recuperar contraseña (envía temporal + enlace al correo) | `POST /api/auth/recover-password` |
| HU-003 | Cambiar contraseña (mínimo 6 caracteres, letras + números + especial) | `PUT /api/auth/change-password` |
| HU-004 | JTH crea el usuario inicial de un servidor público | `POST /api/auth/users` |
| HU-005 | JTH inhabilita el rol de un usuario con fecha de fin | `PUT /api/auth/users/:userId/roles/:roleCode/disable` |

### Módulo 2 — Hoja de Vida del Servidor Público

| HU | Descripción | Endpoint principal |
|----|-------------|--------------------|
| HU-006 | Registrar datos personales | `PUT /api/cv/personal` |
| HU-007 | Distinguir residencia urbana / rural (complemento) | `PUT /api/cv/personal` |
| HU-008 | Registrar formación académica (con tarjeta profesional opcional) | `POST/PUT/DELETE /api/cv/education` |
| HU-009 | Registrar experiencia laboral (incluye DOCENTE) | `POST/PUT/DELETE /api/cv/work` |
| HU-010 | Sección Gerencia Pública (habilitada según cargo) | `GET/PUT /api/cv/management` |
| HU-011 | Guardar avance independiente por sección | Implícito en cada `PUT/POST` |
| HU-012 | Mostrar asteriscos en campos obligatorios | Frontend |
| HU-013 | Adjuntar soportes PDF/JPG, máx 2 MB | Vía `fileBase64` en bodies |
| HU-014 | Previsualizar documento adjunto | `GET /api/cv/attachments/:section/:id?` |
| HU-015 | Descargar HV completa en PDF | `GET /api/cv/export/pdf` |

### Reglas de negocio transversales

- Una vez que el JTH valida una sección (`validated = 1`), el servidor no puede modificarla → respuesta **423 Locked**.
- El JTH levanta la validación mediante `PUT /api/cv/validate`.
- La HV es **única por persona** y se conserva entre vinculaciones a distintas entidades.

---

## Stack tecnológico

### Backend

| Dependencia | Versión | Propósito |
|---|---|---|
| `express` | ^4.18.3 | Servidor HTTP y enrutamiento |
| `sql.js` | ^1.12.0 | SQLite en JavaScript puro (sin binarios nativos) |
| `bcryptjs` | ^2.4.3 | Hash de contraseñas |
| `jsonwebtoken` | ^9.0.2 | JWT (access + refresh tokens) |
| `express-validator` | ^7.0.1 | Validación de bodies y params |
| `express-rate-limit` | ^7.2.0 | Rate limiting (anti brute-force) |
| `helmet` | ^7.1.0 | Headers HTTP de seguridad |
| `cors` | ^2.8.5 | Política CORS |
| `compression` | ^1.7.4 | Compresión gzip |
| `morgan` | ^1.10.0 | Logging HTTP |
| `winston` | ^3.13.0 | Logger general |
| `nodemailer` | ^6.9.13 | Envío de correos (bienvenida, reset) |
| `pdfkit` | ^0.14.0 | Generación de PDF (HU-015) |
| `swagger-jsdoc` | ^6.2.8 | Genera OpenAPI desde JSDoc |
| `swagger-ui-express` | ^5.0.0 | UI interactiva para Swagger |
| `uuid` | ^9.0.1 | IDs únicos (usuarios, tokens) |
| `dotenv` | ^16.4.5 | Carga `.env` |

### Frontend

| Dependencia | Versión | Propósito |
|---|---|---|
| `react` | ^18.2.0 | UI |
| `react-router-dom` | ^6.22.3 | Enrutamiento SPA |
| `react-hook-form` | ^7.51.2 | Manejo de formularios |
| `@hookform/resolvers` | ^3.3.4 | Integración con validadores |
| `zod` | ^3.22.4 | Esquemas de validación |
| `axios` | ^1.6.8 | Cliente HTTP |
| `zustand` | ^4.5.2 | Estado global liviano |
| `react-hot-toast` | ^2.4.1 | Notificaciones |

---

## Cómo ejecutar el proyecto

### Prerequisitos

- **Node.js** 18 LTS o superior.
- **npm** 9+ (viene con Node).
- **Git**.

### 1. Clonar el repositorio

```bash
git clone https://github.com/juanbaloco/SIGED-2.git
cd SIGED-2
```

### 2. Configurar el backend

```bash
cd backend
npm install

# Copia la plantilla de variables de entorno
cp .env.example .env

# Edita .env con un editor y rellena los valores
# (especialmente JWT_SECRET y JWT_REFRESH_SECRET)
```

### 3. Inicializar la base de datos

```bash
# Crea las tablas
npm run db:migrate

# Crea el usuario admin y los datos base (tipos de documento, roles)
npm run db:seed
```

### 4. Arrancar el backend

```bash
npm run dev
```

El backend queda escuchando en `http://localhost:3001`.
La documentación de la API está en `http://localhost:3001/api/docs`.

### 5. Configurar y arrancar el frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm start
```

El frontend queda escuchando en `http://localhost:3000`.

### Credenciales iniciales

| Campo | Valor |
|---|---|
| Tipo de documento | Cédula de Ciudadanía (CC) |
| Número de documento | `00000000` |
| Contraseña | `Admin@2024!` |
| Rol | JTH (Jefe de Talento Humano) |

---

## Variables de entorno

Archivo `backend/.env` (basado en `.env.example`):

```env
# Entorno
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT — Cambiar en producción
JWT_SECRET=cambia-esto-por-algo-largo-y-aleatorio
JWT_REFRESH_SECRET=otro-secreto-distinto-y-largo
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

# Seguridad
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME_MINUTES=15

# SMTP (opcional, solo si quieres correos reales)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-app-password

# Uploads
CV_UPLOAD_DIR=./database/uploads/cv
```

> ⚠️ **NUNCA subas tu `.env` real a Git.** Está en `.gitignore`. Solo se sube `.env.example`.

---

## Documentación OpenAPI

### ¿Qué es?

[OpenAPI 3.0](https://www.openapis.org/) (antes Swagger) es un **estándar** para describir APIs REST en un formato leíble por humanos y máquinas.

### Cómo está implementado

Usamos **enfoque code-first con archivos separados** ("Opción B"):

```
backend/src/
├── routes/                        # Solo routing (limpio)
│   ├── authRoutes.js
│   └── cvRoutes.js
├── docs/openapi/                  # Anotaciones @openapi separadas
│   ├── auth.docs.js
│   └── cv.docs.js
└── config/
    └── swagger.js                 # Spec base: schemas, responses, security
```

### El flujo

1. **`swagger.js`** define la especificación base (info, servers, components.schemas, components.responses, securitySchemes).
2. **`*.docs.js`** contienen comentarios `@openapi` con la descripción de cada endpoint.
3. **`swagger-jsdoc`** lee ambos vía glob (`./src/routes/*.js` y `./src/docs/openapi/*.js`) y los combina.
4. **`swagger-ui-express`** sirve la UI interactiva en `/api/docs`.

### Schemas reutilizables

- `ErrorResponse`, `PersonalInfo`, `Education`, `Work`, `Management`, `CvSummary`, `ValidationResult`, `LoginResponse`.

### Responses estandarizadas (DRY)

- `Unauthorized` (401), `Forbidden` (403), `BadRequest` (400), `NotFound` (404), `Conflict` (409), `Locked` (423), `TooManyRequests` (429), `ServerError` (500).

Cualquier endpoint las referencia con `$ref: '#/components/responses/Unauthorized'`.

### Acceso a la documentación

Con el backend corriendo:

→ **http://localhost:3001/api/docs**

Para probar endpoints protegidos:
1. Hacer `POST /auth/login`.
2. Copiar el `accessToken` del response.
3. Click en **"Authorize" 🔒** arriba a la derecha.
4. Pegar el token.
5. Ahora puedes ejecutar endpoints autenticados desde la UI.

---

## Endpoints disponibles

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | HU |
|---|---|---|---|
| `GET` | `/document-types` | — | — |
| `POST` | `/login` | — | HU-001 |
| `POST` | `/recover-password` | — | HU-002 |
| `GET` | `/verify-reset-token` | — | — |
| `POST` | `/reset-password` | — | HU-002 |
| `POST` | `/refresh` | — | — |
| `GET` | `/me` | ✓ | — |
| `POST` | `/logout` | ✓ | — |
| `PUT` | `/change-password` | ✓ | HU-003 |
| `POST` | `/users` | JTH/ADMIN | HU-004 |
| `PUT` | `/users/:userId/roles/:roleCode/disable` | JTH/ADMIN | HU-005 |

### Usuarios (`/api/users`)

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| `GET` | `/` | JTH/ADMIN | Listar usuarios (paginado, filtros) |
| `GET` | `/search` | JTH/ADMIN | Búsqueda puntual por documento |
| `GET` | `/:id` | JTH/ADMIN | Detalle con historial de roles |
| `GET` | `/:id/audit` | ADMIN | Log de auditoría |
| `PATCH` | `/:id/unlock` | JTH/ADMIN | Desbloquear cuenta |

### Hoja de Vida (`/api/cv`)

| Método | Ruta | HU |
|---|---|---|
| `GET` | `/summary` | — |
| `GET` | `/export/pdf` | HU-015 |
| `GET` / `PUT` | `/personal` | HU-006/007 |
| `GET` / `POST` | `/education` | HU-008 |
| `PUT` / `DELETE` | `/education/:id` | HU-008 |
| `GET` / `POST` | `/work` | HU-009 |
| `PUT` / `DELETE` | `/work/:id` | HU-009 |
| `GET` / `PUT` | `/management` | HU-010 |
| `GET` | `/attachments/:section/:id?` | HU-014 |
| `PUT` | `/validate` (JTH/ADMIN) | Regla "validado → no editable" |

---

## Convenciones del proyecto

### Formato de respuestas

**Éxito**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

### Códigos HTTP usados

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Creado |
| 400 | Body inválido (validación falló) |
| 401 | No autenticado / token expirado |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicado) |
| 423 | Recurso bloqueado (cuenta bloqueada o sección validada) |
| 429 | Rate limit alcanzado |
| 500 | Error interno del servidor |

### Convención de commits ([Conventional Commits](https://www.conventionalcommits.org/))

| Prefijo | Para qué |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo documentación |
| `refactor:` | Cambio sin alterar comportamiento |
| `chore:` | Tareas de mantenimiento (deps, config, gitignore) |
| `ux:` | Mejoras de experiencia de usuario |
| `merge:` | Commits de merge |

Ejemplo: `fix(cv): normaliza formato de respuesta en getManagement (BUG #2)`

### Convención de ramas

| Prefijo | Para qué |
|---|---|
| `feature/hu-XXX-...` | Nueva HU |
| `fix/...` | Bug fix |
| `docs/...` | Solo documentación |
| `refactor/...` | Refactor |

Ejemplo: `feature/hu-006-personal-info`.

### Pull Requests

- Nadie pushea directo a `main`.
- Cada PR debe tener: descripción clara, cómo probar, screenshots si aplica.
- Mínimo 1 revisor aprueba antes del merge.
- Usar "Squash and merge" para mantener historia limpia.

---

## Problemas resueltos durante el desarrollo

### 🐛 BUG #1 — `getSummary` ejecutaba `res.json` dos veces

**Síntoma**: Express tiraba `Cannot set headers after they are sent to the client`. El dashboard no recibía `managementEnabled`.

**Causa**: merge conflict mal resuelto en commit `497fd9c` dejó dos llamadas a `res.json` pegadas.

**Fix**: limpiar la función `getSummary` en `cvController.js`. Una sola llamada a `cvService.getSummary` y una sola `res.json`.

---

### 🐛 BUG #2 — Formato inconsistente en endpoints de Gerencia Pública

**Síntoma**: el frontend no mostraba mensajes de error de Gerencia Pública.

**Causa**: `getManagement` y `saveManagement` devolvían `{ error: '...' }` o `{ data }` (sin `success`), rompiendo el contrato `{ success, message, data }`.

**Fix**: normalizar respuestas a `{ success: true/false, ... }`.

---

### 🐛 BUG #3 — Archivos generados versionados en Git

**Síntoma**: cada `npm run build` generaba un conflicto distinto en `frontend/build/`. Misma situación con `backend/database/sigep2.db`.

**Causa**: no había `.gitignore` consolidado en la raíz; existían `.gitignore` por subproyecto con paths incorrectos.

**Fix**: crear `.gitignore` en raíz, agregar `frontend/build/`, `backend/database/*.db`, `backend/database/uploads/`. Ejecutar `git rm --cached` para sacar lo ya trackeado.

---

### 📋 OBS #1 — `PUT /cv/education/:id` y `PUT /cv/work/:id` sin validaciones (CERRADA)

**Síntoma**: actualizar formación o experiencia permitía pasar campos vacíos.

**Fix**: extraer reglas de validación a constantes (`educationRules`, `workRules`) y aplicarlas tanto en `POST` como en `PUT`. Llamar `handleValidation` en los controllers de update.

---

### 📋 OBS #2 — Sin endpoint para que JTH valide / levante validación (CERRADA)

**Síntoma**: la lógica de bloqueo (validated → no editable) existía, pero no había forma de marcar un registro como validado por API.

**Fix**: crear `PUT /api/cv/validate` con body `{userId, section, recordId, validated}` accesible solo para JTH/ADMIN.

---

### 🔄 OBS #3 — API mezcla snake_case y camelCase (Finalizado por el Scrum Master)

**Síntoma**: las respuestas devuelven `first_name` (snake_case de BD) pero los bodies aceptan `firstName` (camelCase). Inconsistencia.

**Solución **: crear un mapper `dbToApi(row)` en cada service que convierta snake_case → camelCase antes de responder.

---

### 🎨 OBS #4 — Diseño del PDF de exportación (Finalizado por otro miembro)

**Síntoma**: el PDF generado por `cvExportService.js` con `pdfkit` es funcional pero no replica ni muestra un diseño parecido del SIGEP II oficial.

**Finalizado**: refactor del template del PDF.



## Equipo

Universidad Autónoma de Occidente — Facultad de Ingeniería
Proyecto Informático, semestre 2026-1.

| Rol | Responsable |
|---|---|
| Scrum Master + Frontend + Backend Auth (Módulo 1 y 2) | Juan Baloco |
| Backend Hoja de Vida (Módulo 2) | Juan Andres Montealegre |
| Backend Hoja de Vida (Módulo 2) | Santiago Torralba |
| Frontend + Backend Hoja de Vida (Módulo 2) | Diego Alejandro quintero |
| Backend Hoja de Vida (Módulo 2) | Santiago Lopez Lopez |
| Frontend + Diseño PDF | Santiago Lopez Lopez] |

---

## Licencia

Proyecto académico — Uso educativo.
