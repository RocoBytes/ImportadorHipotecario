# 📦 Instalación de Dependencias - Backend

## Inicializar proyecto

```bash
cd backend
npm init -y
```

## Instalar NestJS CLI globalmente (opcional)

```bash
npm install -g @nestjs/cli
```

## Dependencias de Producción

```bash
# Core de NestJS
npm install @nestjs/common @nestjs/core @nestjs/platform-express

# Configuración
npm install @nestjs/config

# Base de datos
npm install @nestjs/typeorm typeorm pg

# Autenticación
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt

# Validación
npm install class-validator class-transformer

# Manejo de archivos
npm install multer papaparse

# Variables de entorno
npm install dotenv

# Reflexión de metadatos (requerido por NestJS)
npm install reflect-metadata rxjs
```

## Dependencias de Desarrollo

```bash
# TypeScript y tipos
npm install -D typescript @types/node @types/express

# NestJS desarrollo
npm install -D @nestjs/cli @nestjs/schematics

# Tipos para las librerías
npm install -D @types/bcrypt @types/passport-jwt @types/multer @types/papaparse

# Herramientas de build
npm install -D ts-node tsconfig-paths ts-loader

# Testing (opcional)
npm install -D @nestjs/testing jest @types/jest ts-jest

# Linting y formato (opcional)
npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier
```

## Comando Único (Copiar y Pegar)

### Solo dependencias esenciales (sin testing ni linting):

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/typeorm typeorm pg @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt class-validator class-transformer multer papaparse dotenv reflect-metadata rxjs && npm install -D typescript @types/node @types/express @nestjs/cli @types/bcrypt @types/passport-jwt @types/multer @types/papaparse ts-node tsconfig-paths
```

### Con testing y linting (completo):

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/typeorm typeorm pg @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt class-validator class-transformer multer papaparse dotenv reflect-metadata rxjs && npm install -D typescript @types/node @types/express @nestjs/cli @nestjs/schematics @types/bcrypt @types/passport-jwt @types/multer @types/papaparse ts-node tsconfig-paths ts-loader @nestjs/testing jest @types/jest ts-jest eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-prettier
```

## Verificar instalación

```bash
# Ver las dependencias instaladas
npm list --depth=0

# Verificar versiones de TypeScript y NestJS
npx tsc --version
npx nest --version
```

## Orden de Ejecución Completo

```bash
# 1. Ir a la carpeta backend
cd backend

# 2. Inicializar npm (si no existe package.json)
npm init -y

# 3. Instalar dependencias (comando único esencial)
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/typeorm typeorm pg @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt class-validator class-transformer multer papaparse dotenv reflect-metadata rxjs && npm install -D typescript @types/node @types/express @nestjs/cli @types/bcrypt @types/passport-jwt @types/multer @types/papaparse ts-node tsconfig-paths

# 4. Crear base de datos
psql -U postgres -c "CREATE DATABASE mutuos_db;"

# 5. Ejecutar schema SQL
psql -U postgres -d mutuos_db -f ../schema.sql

# 6. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 7. Crear usuario admin
npm run seed

# 8. Iniciar servidor
npm run start:dev
```

## Tamaños aproximados

- **Dependencias esenciales:** ~150 MB
- **Con testing y linting:** ~200 MB

## Notas

- Si tienes problemas con bcrypt, prueba: `npm install bcrypt --build-from-source`
- Para Mac M1/M2: algunas dependencias pueden requerir Rosetta
- Node 18+ recomendado para mejor compatibilidad
