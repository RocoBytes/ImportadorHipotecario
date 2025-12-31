# Comandos de Instalación - Backend NestJS

## 1. Inicializar proyecto NestJS

```bash
# Instalar NestJS CLI globalmente (si no lo tienes)
npm install -g @nestjs/cli

# Crear nueva aplicación NestJS
nest new backend

# Entrar al directorio del backend
cd backend
```

## 2. Instalar dependencias necesarias

```bash
# Dependencias principales
npm install @nestjs/typeorm typeorm pg @nestjs/config

# Autenticación y seguridad
npm install @nestjs/passport passport passport-jwt bcrypt
npm install @types/passport-jwt @types/bcrypt --save-dev

# Manejo de archivos y CSV
npm install papaparse multer
npm install @types/papaparse @types/multer @types/express --save-dev

# Class validator y transformer
npm install class-validator class-transformer
```

## 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales locales
```

## 4. Ejecutar en desarrollo

```bash
npm run start:dev
```

## 5. Comandos útiles

```bash
# Generar un módulo
nest g module modules/users

# Generar un controlador
nest g controller modules/users

# Generar un servicio
nest g service modules/users

# Generar un recurso completo (CRUD)
nest g resource modules/operations
```

## Estructura esperada

```
backend/
├── src/
│   ├── config/
│   │   └── database.config.ts
│   ├── modules/
│   │   ├── users/
│   │   ├── operations/
│   │   └── auth/
│   ├── app.module.ts
│   └── main.ts
├── .env
├── .env.example
└── package.json
```
