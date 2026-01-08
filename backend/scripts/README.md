# 🔐 Scripts de Seguridad

Este directorio contiene herramientas automatizadas para gestionar la seguridad del sistema.

## 📜 Scripts Disponibles

### 1. `verify-security.js`

**Propósito:** Verifica la configuración de seguridad antes del despliegue

**Uso:**

```bash
npm run security:check
```

**Qué verifica:**

- ✅ JWT_SECRET con longitud segura (mínimo 64 caracteres)
- ✅ JWT_SECRET no contiene palabras débiles
- ✅ JWT_SECRET es hash hexadecimal de 128 caracteres
- ✅ NODE_ENV configurado correctamente
- ✅ DB_SSL habilitado para producción
- ✅ FRONTEND_URL definido y válido
- ✅ JWT_EXPIRATION configurado
- ✅ .env en .gitignore
- ✅ Dependencias de seguridad instaladas (helmet, throttler, bcrypt, class-validator)

**Códigos de salida:**

- `0` - Todo correcto o solo advertencias
- `1` - Errores críticos encontrados

**Cuándo ejecutar:**

- Antes de cada deploy a producción
- Después de cambiar variables de entorno
- Como parte del CI/CD pipeline

---

### 2. `generate-jwt-secret.js`

**Propósito:** Genera JWT_SECRET criptográficamente seguro

**Uso:**

```bash
npm run generate:secret
```

**Características:**

- Genera secret de 128 caracteres hexadecimales (64 bytes)
- Opción para actualizar .env automáticamente
- Instrucciones paso a paso
- Advertencias de seguridad

**Salida ejemplo:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
882aa4d36b47c426feddd9c24cd2df9502bc954fdf70701a4a93cbfe9cf94607...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Cuándo usar:**

- Al configurar el proyecto por primera vez
- Antes de desplegar a producción
- Después de una brecha de seguridad
- Anualmente como rotación preventiva

---

### 3. `seed-simple.ts`

**Propósito:** Crea usuario administrador inicial

**Uso:**

```bash
npm run seed
```

**Qué hace:**

- Crea usuario ADMIN con credenciales seguras
- Verifica que no exista previamente
- Usa bcrypt para hashear la contraseña

**Credenciales generadas:**

- RUT: `12345678-9`
- Password: `admin123` (cambiar inmediatamente)
- Rol: ADMIN

⚠️ **IMPORTANTE:** Cambiar la contraseña del admin inmediatamente después del primer login.

---

## 🚀 Flujo de Trabajo Recomendado

### Configuración Inicial (Primera vez)

```bash
# 1. Generar JWT_SECRET
npm run generate:secret

# 2. Actualizar .env con las variables de producción

# 3. Verificar seguridad
npm run security:check

# 4. Crear usuario admin
npm run seed
```

### Antes de Deploy a Producción

```bash
# 1. Verificar seguridad
npm run security:check

# 2. Si falla, revisar los errores y corregir

# 3. Ejecutar build y deploy
npm run predeploy  # Ejecuta security:check + build automáticamente
```

### Rotación de Secrets (Anual o Post-Incidente)

```bash
# 1. Generar nuevo JWT_SECRET
npm run generate:secret

# 2. Actualizar .env local

# 3. Actualizar en Render (Dashboard → Environment)

# 4. Verificar
npm run security:check

# 5. Deploy
npm run build

# ⚠️ NOTA: Todos los usuarios deberán volver a autenticarse
```

---

## 🔧 Integración CI/CD

### GitHub Actions (Ejemplo)

```yaml
name: Security Check
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run security:check
```

### Pre-commit Hook (Ejemplo)

```bash
# .husky/pre-commit
#!/bin/sh
cd backend && npm run security:check
```

---

## 📚 Referencias

- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [NestJS Security](https://docs.nestjs.com/security/authentication)

---

## 🆘 Solución de Problemas

### Error: "JWT_SECRET muy corto"

**Solución:** Ejecuta `npm run generate:secret` y usa el secret generado.

### Error: ".env no está en .gitignore"

**Solución:**

```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

### Error: "Dependencias de seguridad faltantes"

**Solución:**

```bash
npm install helmet @nestjs/throttler bcrypt class-validator
```

### Advertencia: "FRONTEND_URL no definido"

**Solución:** Agrega a tu .env:

```bash
FRONTEND_URL=http://localhost:5173,https://tu-app.vercel.app
```

---

## 📞 Soporte

Para preguntas sobre seguridad, contacta al equipo de desarrollo.

**Última actualización:** 7 de enero de 2026
