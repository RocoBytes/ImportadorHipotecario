# 🚀 Backend - Importador Hipotecario

Backend NestJS con PostgreSQL para el sistema de importación de mutuos hipotecarios.

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus datos locales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=mutuos_db
DB_SSL=false
JWT_SECRET=tu_secreto_super_seguro
```

### 3. Crear la base de datos

Asegúrate de que PostgreSQL esté corriendo y crea la base de datos:

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE mutuos_db;

# Salir
\q
```

### 4. Ejecutar el schema SQL

Desde pgAdmin o desde la terminal:

```bash
psql -U postgres -d mutuos_db -f ../schema.sql
```

O desde pgAdmin:
1. Abre pgAdmin
2. Conecta a tu servidor
3. Selecciona la base de datos `mutuos_db`
4. Abre Query Tool
5. Carga y ejecuta el archivo `schema.sql`

### 5. Ejecutar el seed para crear usuario admin

```bash
npm run seed
```

Esto creará el usuario admin con credenciales:
- **RUT:** 1-9
- **Password:** 1234
- **Rol:** ADMIN

## 🏃‍♂️ Ejecutar el Proyecto

### Modo desarrollo (con hot-reload)

```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000`

### Modo producción

```bash
# Compilar
npm run build

# Ejecutar
npm run start:prod
```

## 📡 Endpoints Disponibles

### Autenticación

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "rut": "1-9",
  "password": "1234"
}
```

#### Cambiar Contraseña
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "1234",
  "newPassword": "nueva_contraseña_segura"
}
```

#### Obtener Perfil
```http
POST /api/auth/profile
Authorization: Bearer <token>
```

## 🧪 Probar la API

### Con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"1-9","password":"1234"}'

# Guardar el token de la respuesta y usarlo:
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Cambiar contraseña
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currentPassword":"1234","newPassword":"nueva123"}'
```

### Con Postman/Insomnia

1. Importa la colección de endpoints
2. Haz login para obtener el token
3. Usa el token en el header `Authorization: Bearer <token>`

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.config.ts      # Configuración TypeORM con SSL condicional
│   │   └── config.interface.ts
│   ├── common/
│   │   └── utils/
│   │       └── rut.utils.ts        # Utilidades para RUT
│   ├── modules/
│   │   ├── users/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── users.module.ts
│   │   └── auth/
│   │       ├── decorators/
│   │       ├── dto/
│   │       ├── guards/
│   │       ├── interfaces/
│   │       ├── strategies/
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── auth.module.ts
│   ├── scripts/
│   │   ├── seed-simple.ts          # Script para crear admin
│   │   └── seed.ts                 # Script alternativo
│   ├── app.module.ts
│   └── main.ts
├── .env                            # Variables de entorno (no subir a git)
├── .env.example                    # Ejemplo de variables
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev       # Inicia con hot-reload
npm run start:debug     # Inicia en modo debug

# Producción
npm run build          # Compila el proyecto
npm run start:prod     # Ejecuta la versión compilada

# Base de datos
npm run seed           # Crea el usuario admin inicial

# Código
npm run format         # Formatea el código con Prettier
npm run lint           # Revisa errores de ESLint

# Testing
npm run test           # Ejecuta tests unitarios
npm run test:watch     # Tests en modo watch
npm run test:cov       # Tests con cobertura
```

## 🌐 Despliegue en Producción

### Variables de Entorno para Producción

```env
NODE_ENV=production
DB_HOST=tu-servidor.com
DB_PORT=5432
DB_USERNAME=usuario_prod
DB_PASSWORD=password_seguro
DB_DATABASE=mutuos_db
DB_SSL=true
JWT_SECRET=secreto_muy_seguro_y_aleatorio
PORT=3000
```

### Render/Railway/Heroku

1. Conecta tu repositorio
2. Configura las variables de entorno
3. Define el comando de inicio: `npm run start:prod`
4. Asegúrate de que `DB_SSL=true`

## 🐛 Solución de Problemas

### Error de conexión a la base de datos

```
ERROR: connect ECONNREFUSED 127.0.0.1:5432
```

**Solución:**
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en `.env`
- Asegúrate de que la base de datos exista

### Error "relation does not exist"

**Solución:**
- Ejecuta el archivo `schema.sql` primero
- Verifica que estés conectado a la base de datos correcta

### Error con decoradores

**Solución:**
- Asegúrate de tener `experimentalDecorators: true` en `tsconfig.json`
- Reinstala las dependencias: `rm -rf node_modules && npm install`

## 📚 Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- JWT con expiración configurable
- Validación de RUT antes de consultar BD
- CORS configurado para el frontend
- Variables sensibles en `.env` (nunca subir a git)

## 📝 Licencia

MIT
