---
id: ifa-intro
title: Internal Financial Agents – Arquitectura Técnica
sidebar_position: 2
---

# Internal Financial Agents – Arquitectura Técnica

> **Internal Financial Agents – Arquitectura Técnica**  
> Guía de Referencia para Desarrolladores  
> Rivka Technologies  
> Última actualización: 

Documentación técnica completa para desarrolladores que trabajan en la plataforma **Internal Financial Agents (IFA)**.  
Este documento replica la referencia de arquitectura original en formato web, alineada para impresión como PDF formal.s

---

## Índice

1. Qué Hace Este Sistema  
2. Visión General de la Arquitectura  
3. Estructura del Proyecto  
4. Esquema de Base de Datos  
5. Sistema de Autenticación  
6. Integraciones con APIs Bancarias  
7. Arquitectura del Servicio de IA  
8. Generación de Reportes AR  
9. Middleware de Seguridad  
10. Arquitectura del Frontend  
11. Despliegue  
12. Variables de Entorno  
13. Referencia de Endpoints de API  
14. Flujo de Desarrollo  
15. Decisiones de Diseño  
16. Preguntas Frecuentes  

---

## 1. Qué Hace Este Sistema

La plataforma **Internal Financial Agents** es una aplicación de gestión financiera para Rivka Technologies y empresas relacionadas (Ratespot, Anion, etc.). El sistema proporciona:

1. **Generación de reportes AR**  
   Genera reportes semanales de Cuentas por Cobrar obteniendo datos de múltiples APIs bancarias (Mercury, Brex) y **QuickBooks**.

2. **Chat financiero con IA**  
   Asistente impulsado por **Google Gemini 2.5 Flash** que responde preguntas sobre datos financieros, transacciones y tendencias.

3. **Gestión de usuarios**  
   Control de acceso basado en roles con usuarios administradores y básicos, incluyendo registro de auditoría.

4. **Integración bancaria**  
   Datos de saldos y transacciones en tiempo casi real de las APIs de Mercury, Brex y QuickBooks.

### 1.1. Stack Tecnológico

| Categoría             | Tecnología              | Versión     |
| --------------------- | ---------------------- | ----------- |
| Framework Backend     | Express.js             | 5.1.0       |
| ORM                   | Prisma                 | 7.0.1       |
| Base de Datos         | PostgreSQL (Neon)      | —           |
| Autenticación         | JWT + bcrypt           | 9.0.2 / 5.1.1 |
| Proveedor IA          | Google Gemini          | 2.5 Flash   |
| Generación Excel      | ExcelJS                | 4.4.0       |
| Framework Frontend    | React                  | 19.2.0      |
| Build Frontend        | Vite                   | 7.2.4       |
| Enrutamiento          | React Router DOM       | 7.9.6       |
| Iconos                | Lucide React           | 0.556.0     |
| Despliegue            | Vercel (Serverless)    | —           |

---

## 2. Visión General de la Arquitectura

### 2.1. Arquitectura de Alto Nivel del Sistema

_Nota_: el diagrama de la documentación original se representa aquí como texto estructurado para evitar errores de renderizado al imprimir.

```text
Frontend (React 19 + Vite):
- Páginas: Login, Dashboard, AI Chat, Reports, Users.
- Capa API Service Layer con fetchWithAuth y refresh automático de token.

Flujo principal:
Usuario → Frontend (página correspondiente) → API Service Layer
API Service Layer → Servidor Express 5 (backend)

Backend Express 5:
- Rutas: /auth, /users, /quickbooks, /bank, /ai.
- Controladores: auth, user, quickbooks, bank, ai.
- Servicios: AI, AR Report, Mercury, Brex, QuickBooks, Auth.
- ORM: Prisma → Base de datos PostgreSQL (Neon).

Integraciones externas:
- Mercury (cuentas y tesorería).
- Brex (tarjetas corporativas).
- QuickBooks (contabilidad).

Servicio de IA:
Servicios de backend → Google Gemini 2.5 Flash para chat y análisis financiero.
```

### 2.2. Resumen de Componentes

| Componente             | Tipo       | Propósito                                                   |
| ---------------------- | ---------- | ----------------------------------------------------------- |
| `ai.service.js`        | Servicio   | Integración con Gemini, chat y clasificación de transacciones. |
| `ar-report.service.js` | Servicio   | Generación de reportes Excel (3800+ líneas).               |
| `mercury-api.service.js` | Servicio | Cliente API de Mercury Bank.                               |
| `brex-api.service.js`  | Servicio   | Cliente API de Brex.                                       |
| `quickbooks.service.js`| Servicio   | Obtención de datos de QuickBooks.                          |
| `auth.service.js`      | Servicio   | Tokens JWT, hash de contraseñas.                           |
| `security.js`          | Middleware | Limitación de tasa, cabeceras de seguridad, sanitización.  |
| `AuthContext.jsx`      | React Context | Estado global de autenticación.                        |
| `api.js`              | Servicio Frontend | Llamadas HTTP con actualización de token.           |

---

## 3. Estructura del Proyecto

### 3.1. Estructura de Directorios del Backend

```text
backend/
├─ prisma/
│  ├─ schema.prisma        # Modelos y relaciones de BD
│  ├─ prisma.config.ts     # Configuración Prisma 7
│  ├─ seed.js              # Crea usuario admin inicial
│  └─ migrations/          # Historial de migraciones
├─ src/
│  ├─ index.js             # Punto de entrada Express
│  ├─ config/
│  │  └─ database.js       # Singleton de Prisma client
│  ├─ controllers/         # Manejo de requests (5 archivos)
│  ├─ middlewares/         # Auth, seguridad, validación (5 archivos)
│  ├─ routes/              # Definición de rutas API (6 archivos)
│  ├─ services/            # Lógica de negocio (10 archivos)
│  └─ repositories/        # Capa de acceso a datos
├─ reports/                # Directorio de reportes XLSX generados
├─ package.json
└─ vercel.json             # Configuración serverless
```

### 3.2. Estructura de Directorios del Frontend

```text
frontend/
├─ src/
│  ├─ App.jsx              # Router y definiciones de rutas
│  ├─ main.jsx             # Punto de entrada de la App
│  ├─ context/
│  │  └─ AuthContext.jsx   # Estado global de autenticación
│  ├─ components/
│  │  ├─ Layout.jsx        # Shell de la app con sidebar
│  │  ├─ ProtectedRoute.jsx
│  │  └─ ui/               # Componentes de UI reutilizables
│  ├─ pages/
│  │  ├─ Login.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ AIChat.jsx        # Asistente de IA
│  │  ├─ ReportHistory.jsx # Visor de reportes
│  │  ├─ Users.jsx         # Gestión de usuarios (admin)
│  │  └─ AuditLogs.jsx
│  └─ services/
│     └─ api.js            # Todas las llamadas HTTP (519 líneas)
├─ package.json
└─ vite.config.js
```

---

## 4. Esquema de Base de Datos

La base de datos usa **PostgreSQL** alojado en Neon, con **Prisma ORM** para consultas tipadas.

### 4.1. Visión General de Relaciones entre Entidades

Entidades principales:

- `User` – `id`, `username`, `role`, etc.
- `ARReport` – `id`, `reportData`, `filename`.
- `AuditLog` – `action`, `resource`, `details`.
- `ChatConversation` – `id`, `title`, `userId`.
- `ChatMessage` – `role`, `content`, `metadata`.
- `RefreshToken` – `token`, `expiresAt`.
- `QuickBooksToken` – `realmId`, `accessToken`.

Relaciones clave:

- Un `User` genera muchos `ARReport`.
- Un `User` genera muchos `AuditLog`.
- Un `User` posee muchas `ChatConversation`, cada una con múltiples `ChatMessage`.
- `RefreshToken` vinculado a un usuario.
- `QuickBooksToken` vinculado a la integración contable.

### 4.2. Definiciones de Modelos

#### 4.2.1. Modelo `User`

- `id`: clave primaria UUID.  
- `username`: cadena única (3–30 caracteres, alfanumérico + guion bajo).  
- `password`: hash bcrypt (12 rondas de sal).  
- `role`: enum `BASIC` o `ADMIN`.  
- `status`: enum `ACTIVE`, `INACTIVE`, `SUSPENDED`.  
- `createdBy`: relación auto‑referencial (quién creó este usuario).

#### 4.2.2. Modelo `ARReport`

El campo JSON `reportData` almacena la instantánea financiera completa:

```json
{
  "rivka": {
    "bankAccounts": [{ "bank": "...", "accounts": [...], "total": 0 }],
    "payments": [{ "client": "...", "amount": 0, "invoiceNumber": "..." }],
    "invoicesDueMonth": [...],
    "overdueInvoices": [...],
    "manualBanks": [...],
    "totals": { "total": 0, "paymentsTotal": 0, "overdueTotal": 0 }
  },
  "rivkaMxn": { /* MXN accounts */ },
  "ratespot": { /* misma estructura */ },
  "anion": { "mercuryBalance": 0, "expenses": [...], "totals": {...} }
}
```

#### 4.2.3. Modelos de Chat

| Modelo           | Campos clave      | Propósito                                  |
| ---------------- | ----------------- | ------------------------------------------ |
| `ChatConversation` | `id`, `title`, `userId` | Agrupa mensajes de chat por usuario. |
| `ChatMessage`    | `role`, `content`, `metadata` | Mensaje individual (usuario o asistente). |

---

## 5. Sistema de Autenticación

El sistema de autenticación utiliza tokens basados en **JWT** con actualización automática.

### 5.1. Arquitectura de Tokens

| Tipo de Token       | Duración   | Almacenamiento          | Propósito                          |
| ------------------- | ---------- | ------------------------ | ---------------------------------- |
| Token de Acceso     | 15 minutos | `localStorage`          | Autorización de peticiones API     |
| Token de Actualización | 7 días  | `localStorage` + BD     | Obtener nuevos tokens de acceso    |

### 5.2. Flujo de Autenticación

1. El usuario envía credenciales a `POST /api/auth/login`.  
2. El servidor valida la contraseña con `bcrypt.compare()`.  
3. Se genera un token de acceso (JWT) y un token de actualización (hex de 64 bytes).  
4. El token de actualización se almacena en la BD y ambos se devuelven al cliente.  
5. El cliente guarda los tokens en `localStorage`.  
6. Todas las peticiones API incluyen `Authorization: Bearer <accessToken>`.  
7. Ante un `401`, el cliente actualiza automáticamente usando el token de actualización.

### 5.3. Requisitos de Contraseña

Reglas de validación:

- Mínimo 8 caracteres.
- Al menos una letra mayúscula.
- Al menos una letra minúscula.
- Al menos un número.
- Al menos un carácter especial (`!@#$%&*`...).

### 5.4. Cadena de Middleware

Ejemplo simplificado de `authenticate`:

```js
// middlewares/auth.js
const authenticate = async (req, res, next) => {
  // 1. Extraer token de Authorization: Bearer <token>
  const token = authHeader.substring(7);

  // 2. Verificar firma y expiración del JWT
  const decoded = authService.verifyAccessToken(token);

  // 3. Buscar usuario y verificar estado ACTIVE
  const user = await userService.getUserById(decoded.userId);

  // 4. Adjuntar información de usuario a la request
  req.user = { id: user.id, username: user.username, role: user.role };
};
```

### 5.5. Protección de Rutas de Administrador

Todas las rutas de gestión de usuarios están protegidas con una doble capa:

#### 5.5.1. Cadena de Middleware a Nivel de Ruta

```js
// user.routes.js
// Todas las rutas requieren autenticación Y rol admin
router.use(authenticate); // Primero: debe estar autenticado
router.use(requireAdmin); // Segundo: debe tener rol ADMIN

// Todas las rutas debajo requieren ambos middlewares
router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.delete('/:id', userController.deleteUser);
// ...
```

#### 5.5.2. Middleware `requireAdmin`

```js
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};
```

#### 5.5.3. Escenarios de Acceso

| Tipo de Usuario        | `authenticate` | `requireAdmin` | Resultado              |
| ---------------------- | ------------- | -------------- | ---------------------- |
| No autenticado         | Falla (401)   | —              | No autorizado          |
| Usuario rol BASIC      | Pasa          | Falla (403)    | Prohibido              |
| Usuario rol ADMIN      | Pasa          | Pasa           | Acceso concedido       |
| ADMIN suspendido       | Falla (403)   | —              | Cuenta suspendida      |

> Nota: las llamadas `router.use()` aplican a todas las rutas definidas después de ellas en el archivo.

---

## 6. Integraciones con APIs Bancarias

El sistema obtiene datos bancarios reales de múltiples fuentes, cada una con su propio servicio.

### 6.1. Mercury API

- URL base: `https://api.mercury.com/api/v1`  
- Autenticación: token *Bearer* con prefijo `secret-token:`  
- Empresas: Rivka, Ratespot, Techscale (cada una con su propia API key).

Métodos principales:

| Método                      | Descripción                                  |
| --------------------------- | -------------------------------------------- |
| `getAccounts()`             | Obtiene todas las cuentas con saldos.       |
| `getTreasury()`             | Obtiene cuenta de tesorería.                |
| `getTransactions()`         | Historial de transacciones con rango de fechas. |
| `getRecentTransactions()`   | Atajo para los últimos N días.              |
| `getAllAccountsWithTreasury()` | Cuentas regulares + tesorería combinadas. |

### 6.2. Brex API

- URL base: `https://platform.brexapis.com`.  
- Importante: los montos se devuelven en centavos (dividir entre 100).  
- Endpoints relevantes: `/v2/accounts/cash`, `/v2/accounts/card`.

### 6.3. QuickBooks API

QuickBooks proporciona saldos contables frente a saldos bancarios.

Flujo OAuth2:

1. El usuario visita `/api/quickbooks/auth/url` y obtiene la URL de redirección.  
2. Hace *login* en QuickBooks → *callback* a `/api/quickbooks/auth/callback`.  
3. Los tokens se almacenan en la tabla `QuickBooksToken`.  
4. Los tokens se actualizan automáticamente antes de expirar (acceso ~1 hora, actualización 101 días).

---

## 7. Arquitectura del Servicio de IA

El servicio de IA en `ai.service.js` (≈1280 líneas) potencia la funcionalidad **“Chat con Tus Datos”** usando Google Gemini 2.5 Flash.

### 7.1. Pipeline de Procesamiento en Tres Pasos

1. `selectResources()` determina qué datos se necesitan (reportes históricos, transacciones).  
2. `selectRelevantReports()` usa un modelo rápido para seleccionar reportes relevantes.  
3. `chatAboutReports()` llama al modelo principal para responder usando esos datos.

```text
Paso 0 – selectResources():
- Clasifica si la pregunta es financiera.
- Decide si necesita reportes AR, transacciones o ambos.
- Define días de transacciones y compañías relevantes (Rivka, Ratespot, etc.).

Paso 1 – selectRelevantReports():
- Usa un modelo rápido para elegir qué reportes AR históricos son más relevantes.
- Devuelve una lista de IDs de reportes a incluir en el contexto.

Paso 2 – chatAboutReports():
- Construye el *prompt* con los reportes y/o transacciones seleccionadas.
- Llama a Gemini 2.5 Flash para generar la respuesta.
- Devuelve texto final y, cuando aplica, datos estructurados para visualizaciones.
```

### 7.2. Esquema de Selección de Recursos

```js
const RESOURCE_SELECTION_SCHEMA = {
  isFinancialQuestion: boolean, // Filtrar preguntas no financieras
  needsReports: boolean,       // ¿Necesita reportes AR históricos?
  needsTransactions: boolean,  // ¿Necesita datos de transacciones?
  reportIds: string[],         // IDs específicos de reportes a incluir
  transactionDays: number,     // 7, 14, 30, 60 o 90 días
  companies: ['rivka' | 'ratespot'],
  reasoning: string            // Explicación del modelo
};
```

### 7.3. Clasificación de Transacciones

La IA clasifica las transacciones en categorías de gasto:

| Categoría             | Descripción                          |
| --------------------- | ------------------------------------ |
| `PAYROLL`             | Salarios, pagos a contratistas       |
| `SOFTWARE`            | Suscripciones SaaS, licencias        |
| `MARKETING`           | Publicidad, campañas                 |
| `OFFICE`              | Renta, servicios, suministros        |
| `TRAVEL`              | Transporte, hoteles                  |
| `PROFESSIONAL_SERVICES` | Legal, contabilidad, consultoría  |
| `BANKING`             | Comisiones bancarias, intereses      |
| `TAXES`               | Pagos al gobierno                    |
| `OTHER`               | Categoría general                    |

### 7.4. Manejo de Preguntas No Financieras

La IA está entrenada para ser solo un asistente financiero.  
Preguntas fuera de alcance reciben respuestas del tipo:

> “Soy un asistente financiero de Rivka. Solo puedo ayudar con preguntas sobre reportes AR, saldos, facturas, pagos, cobranza y gastos...”

---

## 8. Generación de Reportes AR

`ar-report.service.js` es el archivo de servicio más grande (≈3800 líneas) y genera reportes Excel con estilos detallados.

### 8.1. Secciones del Reporte

1. **RIVKA (USD)** – Empresa principal de EE. UU. con Mercury, Brex y bancos manuales.  
2. **RIVKA TECHNOLOGIES SA DE CV (MXN)** – Entidad mexicana (BBVA).  
3. **RATESPOT (USD)** – Empresa hermana.  
4. **ANION** – Empresa de inversión (Mercury + gastos).

### 8.2. Estilos del Reporte

| Elemento          | Código    | Uso                               |
| ----------------- | --------- | --------------------------------- |
| Fondo de título   | `FFFF9900`| Naranja para encabezados de sección. |
| Fondo de cabecera | `FFEFEFEF`| Gris para cabeceras de columna.   |
| Banco Mercury     | `FFC9DAF8`| Azul claro para filas Mercury.    |
| Banco Brex        | `FFB7E1CD`| Verde azulado para filas Brex.    |
| QuickBooks        | `FFF4CCCC`| Coral claro para filas QB.        |
| Totales           | `FF33FF33`| Verde brillante para totales.     |

### 8.3. Mapeo de Nombres de Cuentas

```js
const MERCURY_ACCOUNT_MAPPING = {
  '7737': 'Anion',
  '3298': 'Rivka',
  '5081': 'Ratespot LLC',
};
// "Mercury Checking **7737" -> "Anion"
```

---

## 9. Middleware de Seguridad

El middleware `security.js` maneja varios aspectos críticos de seguridad.

### 9.1. Limitador de Peticiones

| Limitador          | Ventana     | Máx Peticiones | Propósito                   |
| ------------------ | ----------- | -------------- | --------------------------- |
| `apiRateLimiter`   | 15 minutos  | 200            | Protección general de API   |
| `aiRateLimiter`    | 1 minuto    | 10             | Peticiones de IA (costosas) |
| `authRateLimiter`  | 15 minutos  | 10             | Intentos de login           |
| `reportRateLimiter`| 1 minuto    | 5              | Generación de reportes      |

### 9.2. Cabeceras de Seguridad

```js
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY'); // Clickjacking
  res.setHeader('X-Content-Type-Options', 'nosniff'); // MIME sniffing
  res.setHeader('X-XSS-Protection', '1; mode=block'); // XSS filter
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.removeHeader('X-Powered-By'); // Ocultar Express
  next();
};
```

### 9.3. Sanitización de Peticiones

Previene ataques de **prototype pollution**:

```js
const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    delete req.body.__proto__;
    delete req.body.constructor;
    delete req.body.prototype;
    // Podría aplicarse recursivamente a objetos anidados
  }
  next();
};
```

---

## 10. Arquitectura del Frontend

### 10.1. `AuthContext`

Estado global de autenticación usando React Context:

```js
const value = {
  user,           // Usuario actual
  loading,        // Chequeo inicial de auth
  isAuthenticated: !!user,
  isAdmin: user?.role === 'ADMIN',
  login,          // Función async
  logout,         // Función async
  changePassword, // Función async
};
```

### 10.2. Rutas Protegidas

```jsx
// Protección básica: solo requiere login
<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route index element={<Dashboard />} />
  <Route path="ai-assistant" element={<AIChat />} />
</Route>

// Protección solo admin
<Route
  path="users"
  element={
    <ProtectedRoute requireAdmin>
      <Users />
    </ProtectedRoute>
  }
/>
```

### 10.3. Capa de Servicios API

Todas las llamadas HTTP pasan por `api.js` con actualización automática de token:

```js
// Si la petición devuelve 401...
if (response.status === 401 && accessToken) {
  const refreshResponse = await fetch('/auth/refresh', {
    body: JSON.stringify({ refreshToken }),
  });

  if (refreshResponse.ok) {
    setTokens(data.accessToken, data.refreshToken);
    // Reintentar con nuevo token
    response = await fetch(url, { ...options, headers: newHeaders });
  } else {
    clearTokens();
    window.location.href = '/login';
  }
}
```

---

## 11. Despliegue

Tanto el frontend como el backend se despliegan en **Vercel** como funciones serverless.

### 11.1. Configuración de Vercel

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### 11.2. Consideraciones Serverless

```js
// No iniciar servidor en modo serverless
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Exportar para función serverless de Vercel
module.exports = app;

// Directorio de reportes
const REPORTS_FOLDER =
  process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'reports')
    : path.join(__dirname, '../../reports');
```

---

## 12. Variables de Entorno

### 12.1. Entorno del Backend

| Variable                   | Ejemplo                  | Propósito                               |
| -------------------------- | ------------------------ | --------------------------------------- |
| `PORT`                     | `3000`                   | Puerto del servidor                     |
| `DATABASE_URL`            | `postgresql://...`       | Conexión PostgreSQL Neon                |
| `JWT_SECRET`              | `tu-clave-secreta`       | Clave de firma JWT                      |
| `MERCURY_API_KEY_RIVKA`   | `secret-token:xxx`       | API Mercury para Rivka                  |
| `MERCURY_API_KEY_RATESPOT`| `secret-token:xxx`       | API Mercury para Ratespot               |
| `BREX_API_TOKEN`          | `xxx`                    | Token API de Brex                       |
| `GEMINI_API_KEY`          | `AIza...`                | Clave API de Google AI                  |
| `FRONTEND_URL`            | `https://...`            | Origen permitido para CORS              |

### 12.2. Entorno del Frontend

| Variable       | Ejemplo                     | Propósito                    |
| -------------- | --------------------------- | ---------------------------- |
| `VITE_API_URL` | `http://localhost:3000/api` | URL de la API del backend    |

---

## 13. Referencia de Endpoints de API

### 13.1. Endpoints de Autenticación

| Método | Endpoint             | Descripción                      |
| ------ | -------------------- | -------------------------------- |
| POST   | `/api/auth/login`    | Login con usuario/contraseña    |
| POST   | `/api/auth/refresh`  | Obtener nuevo token de acceso   |
| POST   | `/api/auth/logout`   | Revocar token de actualización  |
| GET    | `/api/auth/me`       | Obtener información del usuario |
| PUT    | `/api/auth/password` | Cambiar contraseña              |

### 13.2. Endpoints de Gestión de Usuarios (Solo Admin)

| Método | Endpoint                        | Descripción                  |
| ------ | ------------------------------- | ---------------------------- |
| GET    | `/api/users`                    | Listar todos los usuarios    |
| POST   | `/api/users`                    | Crear nuevo usuario          |
| GET    | `/api/users/:id`                | Obtener usuario por ID       |
| PUT    | `/api/users/:id`                | Actualizar usuario           |
| DELETE | `/api/users/:id`                | Eliminar usuario             |
| PUT    | `/api/users/:id/password`       | Restablecer contraseña       |
| POST   | `/api/users/:id/suspend`        | Suspender usuario            |
| POST   | `/api/users/:id/activate`       | Activar usuario              |
| GET    | `/api/users/audit/logs`         | Obtener logs de auditoría    |

### 13.3. Endpoints de IA

| Método | Endpoint                          | Descripción                        |
| ------ | --------------------------------- | ---------------------------------- |
| POST   | `/api/ai/chat`                    | Chat sobre finanzas                |
| GET    | `/api/ai/conversations`           | Obtener historial de chat          |
| GET    | `/api/ai/conversations/:id`       | Obtener conversación específica    |
| DELETE | `/api/ai/conversations/:id`       | Eliminar conversación              |
| GET    | `/api/ai/insights/:company`       | Obtener insights de gastos         |
| POST   | `/api/ai/classify/:company`       | Clasificar transacciones           |
| GET    | `/api/ai/compare`                 | Comparar reportes en el tiempo     |

### 13.4. Endpoints de QuickBooks y Reportes

| Método | Endpoint                                  | Descripción                   |
| ------ | ----------------------------------------- | ----------------------------- |
| GET    | `/api/quickbooks/auth/url`                | Obtener URL OAuth             |
| GET    | `/api/quickbooks/auth/callback`           | Callback de OAuth             |
| POST   | `/api/quickbooks/auth/refresh`            | Refrescar tokens de QB        |
| GET    | `/api/quickbooks/reports/ar`              | Generar reporte AR            |
| GET    | `/api/quickbooks/reports/ar/list`         | Listar reportes guardados     |
| POST   | `/api/quickbooks/reports/ar/import`       | Importar desde Excel          |
| DELETE | `/api/quickbooks/reports/ar/:id`          | Eliminar reporte              |
| PATCH  | `/api/quickbooks/reports/ar/:id/notes`    | Actualizar notas              |

---

## 14. Flujo de Desarrollo

### 14.1. Configuración Local

```bash
# Clonar el repositorio
git clone https://github.com/Rivka-Interno/internal-financial-agents.git
cd internal-financial-agents

# Backend setup
cd backend
npm install
cp .env.example .env   # Editar con tus valores
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed    # Crea usuario admin
npm run dev            # Inicia en puerto 3000

# Frontend setup (nueva terminal)
cd frontend
npm install
npm run dev            # Inicia en puerto 5173
```

### 14.2. Comandos Comunes

| Contexto | Comando               | Propósito                 |
| -------- | --------------------- | ------------------------- |
| Backend  | `npm run dev`         | Iniciar con hot reload    |
| Backend  | `npm run prisma:studio` | GUI de base de datos   |
| Backend  | `npm run prisma:migrate` | Ejecutar migraciones  |
| Backend  | `npm run prisma:seed` | Crear usuario admin       |
| Frontend | `npm run dev`         | Iniciar servidor dev      |
| Frontend | `npm run build`       | Build de producción       |
| Frontend | `npm run lint`        | Verificación ESLint       |

---

## 15. Decisiones de Diseño

### 15.1. ¿Por Qué JavaScript en Lugar de TypeScript?

El código usa JavaScript por simplicidad y rapidez de iteración.  
Los comentarios JSDoc proporcionan documentación de tipos donde es necesario.

### 15.2. ¿Por Qué Prisma 7?

- Rendimiento mejorado y nuevo formato `prisma.config.ts`.  
- Soporte nativo para el adaptador serverless de **Neon Postgres**.

### 15.3. ¿Por Qué Gemini en Lugar de OpenAI?

1. **Costo:** Gemini Flash es más económico para uso de alto volumen.  
2. **Salida estructurada:** soporte nativo de esquema JSON.  
3. **Velocidad:** modelo Flash optimizado para baja latencia.

### 15.4. ¿Por Qué Almacenar Reportes como JSON?

Almacenar `reportData` como JSON permite:

- Registro histórico completo del estado financiero de cada semana.  
- La IA puede consultar cualquier dato histórico sin regenerar reportes.  
- No es necesario volver a obtener datos de las APIs para análisis histórico.  
- Mayor flexibilidad para futuras funciones de análisis.

---

## 16. Preguntas Frecuentes

- **¿Por qué mi sesión expira aleatoriamente?**  
  El token de acceso expira cada 15 minutos. El frontend debería actualizarlo automáticamente; si el token de actualización (7 días) también expiró, la sesión se cierra.

- **¿Por qué algunos saldos bancarios muestran $0?**  
  Verifica que las API keys estén configuradas correctamente en `.env`. Algunas cuentas pueden tener legítimamente saldo cero.

- **¿Cómo agrego un nuevo usuario admin?**  
  Un admin existente puede crear usuarios en la UI, o puedes modificar `prisma/seed.js` y ejecutar `npm run prisma:seed`.

- **La IA está dando respuestas extrañas.**  
  La IA está restringida a preguntas financieras. Verifica que existan reportes AR válidos en la base de datos.

- **Los reportes no se descargan.**  
  Revisa la consola del navegador para errores. El servidor puede estar quedándose sin almacenamiento temporal en Vercel, o pueden haber expirado los tokens de QuickBooks.

---

Este documento está optimizado para que, al imprimirlo, obtengas un **PDF formal** de Internal Financial Agents, alineado con la documentación original pero mantenido desde este sitio de documentación técnico.

