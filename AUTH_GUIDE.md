# 🔐 Guía de Autenticación - Importador Hipotecario

## Estructura Creada

```
backend/src/
├── modules/
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts          # Entidad User con TypeORM
│   │   └── users.module.ts
│   └── auth/
│       ├── decorators/
│       │   ├── get-user.decorator.ts   # Decorador para obtener usuario del request
│       │   └── roles.decorator.ts      # Decorador para proteger por roles
│       ├── dto/
│       │   ├── login.dto.ts            # DTO para login
│       │   ├── change-password.dto.ts  # DTO para cambio de contraseña
│       │   └── login-response.dto.ts   # DTO de respuesta de login
│       ├── guards/
│       │   ├── jwt-auth.guard.ts       # Guard para proteger rutas con JWT
│       │   └── roles.guard.ts          # Guard para validar roles
│       ├── interfaces/
│       │   └── jwt-payload.interface.ts
│       ├── strategies/
│       │   └── jwt.strategy.ts         # Estrategia de Passport JWT
│       ├── auth.controller.ts          # Endpoints de Auth
│       ├── auth.service.ts             # Lógica de negocio Auth
│       └── auth.module.ts
├── common/
│   └── utils/
│       └── rut.utils.ts                # Utilidades para normalizar RUT
└── scripts/
    ├── seed.ts                         # Script seed principal
    └── seed-simple.ts                  # Script seed alternativo (recomendado)
```

## Endpoints Disponibles

### 1. Login

**POST** `/api/auth/login`

```json
{
  "rut": "1-9",
  "password": "1234"
}
```

**Respuesta:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mustChangePassword": true,
  "user": {
    "id": "uuid-here",
    "rut": "1-9",
    "rol": "ADMIN"
  }
}
```

### 2. Cambiar Contraseña (Requiere JWT)

**POST** `/api/auth/change-password`

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "currentPassword": "1234",
  "newPassword": "nueva_contraseña_segura"
}
```

**Respuesta:**

```json
{
  "message": "Contraseña cambiada exitosamente"
}
```

### 3. Obtener Perfil (Requiere JWT)

**POST** `/api/auth/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "id": "uuid-here",
  "rut": "1-9",
  "rol": "ADMIN",
  "mustChangePassword": false
}
```

## Características Implementadas

### ✅ Normalización de RUT

- Elimina puntos automáticamente
- Valida formato (12345678-9 o 1-9)
- Valida dígito verificador
- Funciones disponibles en `rut.utils.ts`:
  - `normalizeRut()` - Quita puntos y espacios
  - `isValidRutFormat()` - Valida formato
  - `isValidRutVerifier()` - Valida dígito verificador
  - `formatRut()` - Agrega puntos para mostrar

### ✅ Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds por defecto)
- JWT con expiración configurable
- Guards para proteger rutas
- Validación de DTOs con class-validator

### ✅ Flujo de Cambio de Contraseña

1. Usuario hace login y recibe `mustChangePassword: true`
2. Frontend debe redirigir a página de cambio de contraseña
3. Usuario cambia contraseña con token JWT
4. `mustChangePassword` se setea en `false`

## Ejecutar el Seed

### Opción 1: Script Simple (Recomendado)

```bash
cd backend

# Instalar ts-node si no lo tienes
npm install -D ts-node

# Ejecutar seed
npx ts-node -r tsconfig-paths/register src/scripts/seed-simple.ts
```

### Opción 2: Agregar script a package.json

Agrega esto a `backend/package.json` en la sección `scripts`:

```json
{
  "scripts": {
    "seed": "ts-node -r tsconfig-paths/register src/scripts/seed-simple.ts"
  }
}
```

Luego ejecuta:

```bash
npm run seed
```

## Credenciales de Usuario Admin Inicial

```
RUT:      1-9
Password: 1234
Rol:      ADMIN
```

⚠️ **IMPORTANTE:** Cambia la contraseña después del primer login.

## Proteger Rutas en Otros Controladores

### Proteger con JWT (cualquier usuario autenticado)

```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("operations")
export class OperationsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    // Solo usuarios autenticados pueden acceder
  }
}
```

### Proteger por Rol (solo ADMIN)

```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Post("import")
  @Roles(UserRole.ADMIN)
  import() {
    // Solo usuarios con rol ADMIN pueden acceder
  }
}
```

### Obtener Usuario Actual

```typescript
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";

@Controller("operations")
export class OperationsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser() user: User) {
    // user contiene toda la información del usuario autenticado
    console.log(user.id, user.rut, user.rol);
  }
}
```

## Probar con cURL

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"1-9","password":"1234"}'
```

### Cambiar Contraseña

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"currentPassword":"1234","newPassword":"nueva123"}'
```

### Obtener Perfil

```bash
curl -X POST http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu `.env`:

```env
JWT_SECRET=secreto_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

## Próximos Pasos

1. ✅ Ejecutar el script seed para crear el admin
2. ✅ Probar el login con Postman o cURL
3. ✅ Cambiar la contraseña del admin
4. 🔄 Implementar módulo de Operations
5. 🔄 Implementar módulo de Import
