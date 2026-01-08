# Backend - Sistema Importador Hipotecario

Este es el backend del Sistema Importador Hipotecario construido con NestJS.

## 🚀 Despliegue en Render

### Variables de Entorno Requeridas

```bash
# Base de Datos (Supabase)
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_supabase
DB_DATABASE=postgres
DB_SSL=true

# JWT (CRÍTICO - Generar nuevo secret)
JWT_SECRET=tu_jwt_secret_128_caracteres_hex
JWT_EXPIRATION=7d

# Aplicación
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://tu-app.vercel.app

# Archivos
MAX_FILE_SIZE=10485760
```

### Comandos Build

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`

### Configuración de Render

1. Conecta tu repositorio de GitHub
2. Selecciona el directorio `backend`
3. Runtime: Node
4. Configura las variables de entorno arriba
5. Deploy

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Generar JWT_SECRET seguro
npm run generate:secret

# Verificar seguridad
npm run security:check

# Desarrollo
npm run start:dev

# Build
npm run build

# Producción
npm run start:prod
```

## 📦 Scripts Disponibles

- `npm run build` - Compilar aplicación
- `npm run start:prod` - Iniciar en producción
- `npm run start:dev` - Desarrollo con hot reload
- `npm run security:check` - Verificar configuración de seguridad
- `npm run generate:secret` - Generar nuevo JWT_SECRET
- `npm run seed` - Crear usuario admin inicial

## 🔒 Seguridad

Antes de desplegar, ejecuta:

```bash
npm run security:check
```

Este comando verifica:

- JWT_SECRET seguro (128 caracteres)
- Variables de entorno configuradas
- Dependencias de seguridad instaladas
- Configuración SSL correcta

## 📚 Documentación API

Una vez desplegado, la documentación Swagger estará disponible en:

`https://tu-backend.onrender.com/api/docs`

## 🗄️ Base de Datos

El sistema usa PostgreSQL. Para producción, se recomienda Supabase:

1. Crea proyecto en Supabase
2. Copia credenciales de conexión
3. Ejecuta el schema: `backend/src/database/schema.sql`
4. Configura variables de entorno en Render

## 🔐 Variables de Entorno Críticas

### JWT_SECRET

**CRÍTICO:** Debe ser único por entorno. Genera uno con:

```bash
npm run generate:secret
```

### FRONTEND_URL

Lista de URLs permitidas separadas por coma:

```bash
FRONTEND_URL=https://tu-app.vercel.app,https://www.tu-app.vercel.app
```

### DB_SSL

**IMPORTANTE:**

- Local: `false`
- Producción: `true`

## 📞 Soporte

Para problemas de despliegue, revisa:

- [SEGURIDAD.md](../SEGURIDAD.md) - Guía de seguridad
- [DESPLIEGUE.md](../DESPLIEGUE.md) - Guía de despliegue
- [backend/scripts/README.md](scripts/README.md) - Scripts de seguridad
