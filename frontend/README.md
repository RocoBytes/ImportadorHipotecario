# 🎨 Frontend - Importador Hipotecario

Frontend React + Vite + TypeScript con TailwindCSS para el sistema de importación de mutuos hipotecarios.

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn

## 🚀 Instalación Rápida

```bash
# 1. Crear proyecto con Vite
npm create vite@latest frontend -- --template react-ts
cd frontend

# 2. Instalar todas las dependencias
npm install axios react-router-dom lucide-react && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 📦 Dependencias Instaladas

### Producción

- **React 18** - Librería UI
- **React Router DOM** - Enrutamiento
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

### Desarrollo

- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **TailwindCSS** - Framework CSS
- **PostCSS** - Procesador CSS
- **Autoprefixer** - Prefijos CSS automáticos

## 🏗️ Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   └── PrivateRoute.tsx        # Protección de rutas
│   ├── contexts/
│   │   └── AuthContext.tsx         # Context de autenticación
│   ├── pages/
│   │   ├── LoginPage.tsx           # Página de login
│   │   ├── DashboardPage.tsx       # Dashboard principal
│   │   ├── ChangePasswordPage.tsx  # Cambio de contraseña
│   │   └── UnauthorizedPage.tsx    # Página 403
│   ├── services/
│   │   ├── api.ts                  # Configuración axios
│   │   └── auth.service.ts         # Servicio de autenticación
│   ├── App.tsx                     # Componente principal
│   ├── routes.tsx                  # Configuración de rutas
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Estilos globales
├── .env                            # Variables de entorno
├── .env.example                    # Ejemplo de variables
├── tailwind.config.js              # Configuración Tailwind
├── postcss.config.js               # Configuración PostCSS
├── vite.config.ts                  # Configuración Vite
└── package.json
```

## 🔐 AuthProvider - Context API

### Características Implementadas

1. **Persistencia de Sesión**

   - Token y usuario guardados en `localStorage`
   - Carga automática al iniciar la aplicación

2. **Interceptor Axios**

   - Agrega token automáticamente a todas las peticiones
   - Logout automático en respuestas 401

3. **Estados Disponibles**
   ```typescript
   {
     user: User | null,
     token: string | null,
     isAuthenticated: boolean,
     isLoading: boolean,
     login: (credentials) => Promise<void>,
     logout: () => void,
     updateUser: (user) => void
   }
   ```

### Uso del AuthContext

```tsx
import { useAuth } from "./contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <p>Hola, {user?.rut}</p>
      <button onClick={logout}>Salir</button>
    </div>
  );
}
```

## 🛣️ Sistema de Rutas

### Rutas Públicas

- `/login` - Solo accesible si NO estás autenticado

### Rutas Privadas (Requieren Autenticación)

- `/` - Dashboard principal
- `/change-password` - Cambio de contraseña

### Rutas por Rol

- Rutas ADMIN - Solo accesibles por usuarios con rol `ADMIN`
- Rutas protegidas con componente `<RoleRoute>`

### Protección de Rutas

```tsx
// Solo usuarios autenticados
<Route element={<PrivateRoute />}>
  <Route path="/" element={<DashboardPage />} />
</Route>

// Solo usuarios NO autenticados
<Route element={<PublicRoute />}>
  <Route path="/login" element={<LoginPage />} />
</Route>

// Solo ADMIN
<Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
  <Route path="/import" element={<ImportPage />} />
</Route>
```

## 🎨 Estilos con TailwindCSS

### Clases Personalizadas

```css
/* Botones */
.btn-primary    /* Botón azul principal */
/* Botón azul principal */
.btn-secondary  /* Botón gris secundario */
.btn-danger     /* Botón rojo de peligro */

/* Inputs */
.input-field    /* Campo de texto estándar */

/* Contenedores */
.card; /* Tarjeta blanca con sombra */
```

### Uso

```tsx
<button className="btn-primary">
  Guardar
</button>

<input className="input-field" placeholder="RUT" />

<div className="card">
  <h2>Título</h2>
</div>
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
VITE_API_URL=http://localhost:3000
```

**Acceso en código:**

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Axios Interceptors

**Request Interceptor:**

- Agrega `Authorization: Bearer <token>` automáticamente

**Response Interceptor:**

- Detecta errores 401
- Limpia localStorage
- Dispara evento `unauthorized`
- Redirige a `/login`

## 📱 Páginas Implementadas

### LoginPage

- Formulario de login con RUT y contraseña
- Validación de errores
- Diseño responsive
- Redirección automática después de login

### DashboardPage

- Header con información del usuario
- Botón de logout
- Cards de información
- Botón para cambiar contraseña

### ChangePasswordPage

- Formulario de cambio de contraseña
- Validaciones (mínimo 4 caracteres, confirmación)
- Actualización del flag `mustChangePassword`
- Redirección automática después de cambiar

### UnauthorizedPage

- Página 403
- Mensaje de acceso denegado
- Botón para volver al inicio

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (puerto 5173)

# Build
npm run build        # Compila para producción
npm run preview      # Vista previa del build

# Linting
npm run lint         # Ejecuta ESLint
```

## 🔍 Testing Manual

### 1. Login con Usuario Admin

```bash
# Usuario creado por el seed
RUT: 1-9
Password: 1234
```

### 2. Flujo de Cambio de Contraseña

1. Login con credenciales temporales
2. Sistema detecta `mustChangePassword: true`
3. Redirige a `/change-password`
4. Usuario cambia contraseña
5. Flag se actualiza a `false`
6. Redirige a dashboard

### 3. Logout Automático en 401

1. Backend responde con 401
2. Interceptor detecta el error
3. Limpia localStorage
4. Dispara evento `unauthorized`
5. AuthContext ejecuta logout
6. Usuario es redirigido a `/login`

## 🎯 Flujo de Autenticación

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ Ingresa credenciales
       ▼
┌─────────────────┐
│   LoginPage     │
│                 │
│  POST /login    │
└────────┬────────┘
         │
         │ Guarda token y user
         ▼
┌─────────────────┐
│  localStorage   │
│                 │
│  - token        │
│  - user         │
└────────┬────────┘
         │
         │ AuthProvider carga datos
         ▼
┌─────────────────┐
│  isAuthenticated│
│      = true     │
└────────┬────────┘
         │
         │ Redirige a /
         ▼
┌─────────────────┐
│  DashboardPage  │
└─────────────────┘
```

## 🐛 Troubleshooting

### Error: "Network Error"

**Causa:** Backend no está corriendo o CORS mal configurado

**Solución:**

```bash
# Verificar que el backend esté corriendo
cd backend
npm run start:dev

# Verificar que FRONTEND_URL esté en .env del backend
FRONTEND_URL=http://localhost:5173
```

### Error: "401 Unauthorized"

**Causa:** Token expirado o inválido

**Solución:**

- El sistema hace logout automático
- Vuelve a hacer login

### Estilos de Tailwind no se aplican

**Solución:**

```bash
# Verificar que los archivos estén configurados
# 1. tailwind.config.js debe tener el content correcto
# 2. index.css debe tener las directivas @tailwind
# 3. Reiniciar el servidor de desarrollo
npm run dev
```

## 🔒 Seguridad

- ✅ Token JWT almacenado en localStorage
- ✅ Logout automático en 401
- ✅ Protección de rutas por autenticación
- ✅ Protección de rutas por rol
- ✅ Validación de formularios
- ✅ Limpieza de datos al logout

## 📝 Próximos Pasos

1. ✅ Setup completo del frontend
2. ✅ AuthProvider con persistencia
3. ✅ Sistema de rutas con protección
4. ✅ Páginas de login y dashboard
5. 🔄 Página de importación de CSV (siguiente paso)
6. 🔄 Página de consulta de operaciones
7. 🔄 Dashboards y reportes

## 🎨 Personalización

### Colores

Edita `tailwind.config.js` para cambiar la paleta de colores:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Tus colores personalizados
      },
    },
  },
}
```

### Logo

Reemplaza el ícono en `LoginPage.tsx` con tu logo:

```tsx
<img src="/logo.png" alt="Logo" className="w-16 h-16 mb-4" />
```

## 📚 Recursos

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Lucide Icons](https://lucide.dev/)
