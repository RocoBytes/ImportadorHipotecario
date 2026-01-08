# 🔒 Guía de Seguridad para Despliegue en Producción

## ⚡ Verificación Rápida de Seguridad

Antes de desplegar, ejecuta:

```bash
cd backend
npm run security:check
```

Este script verifica automáticamente:

- ✅ JWT_SECRET con longitud y formato seguro
- ✅ Variables de entorno críticas configuradas
- ✅ Dependencias de seguridad instaladas
- ✅ .env no expuesto en Git

---

## ✅ Lista de Verificación de Seguridad

### 1. Variables de Entorno (CRÍTICO)

#### Backend (Render)

```bash
# Base de Datos (Supabase)
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=TU_PASSWORD_SUPABASE_AQUI
DB_DATABASE=postgres
DB_SSL=true

# JWT - ⚠️ CRÍTICO: Generar secret único criptográficamente seguro
# NUNCA usar el mismo secret en desarrollo y producción
# NUNCA compartir este secret en repositorios públicos
JWT_SECRET=GENERAR_CON_COMANDO_ABAJO_128_CARACTERES
JWT_EXPIRATION=7d

# BCrypt
BCRYPT_ROUNDS=10

# Servidor
PORT=10000
NODE_ENV=production

# CORS - URLs permitidas (separadas por coma)
# Incluir todos los dominios desde donde se accederá a la API
FRONTEND_URL=https://tu-app.vercel.app,https://www.tu-app.vercel.app
```

**🔐 Generar JWT_SECRET seguro (128 caracteres hexadecimales):**

```bash
# Ejecutar en terminal para generar un secret criptográficamente seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Resultado ejemplo (NO USAR ESTE, genera el tuyo):
# 882aa4d36b47c426feddd9c24cd2df9502bc954fdf70701a4a93cbfe9cf94607a19be83d5ab90dc400ed1e0fc905b12d7de16061bb25a066388394738fb58e8a
```

**📋 Copiar el resultado y pegarlo en:**

- Render: Dashboard → Environment → JWT_SECRET
- Local: backend/.env → JWT_SECRET

#### Frontend (Vercel)

```bash
VITE_API_URL=https://tu-backend.onrender.com/api
```

---

## 🛡️ Medidas de Seguridad Implementadas

### 1. **JWT Authentication**

✅ **Secret Criptográfico** - 128 caracteres hexadecimales (64 bytes)
✅ **Expiración** - Tokens expiran en 7 días por defecto
✅ **Validación automática** - Estrategia Passport verifica cada request

### 2. **CORS (Cross-Origin Resource Sharing)**

✅ **Configurado** - Solo acepta requests desde orígenes permitidos

- Local: `http://localhost:5173`
- Producción: URLs especificadas en `FRONTEND_URL`
- **Acción requerida**: Actualizar `FRONTEND_URL` con tu dominio de Vercel

### 2. **Rate Limiting (Limitación de Tasa)**

✅ **Implementado**

- **Global**: 100 requests por minuto por IP
- **Login**: 5 intentos por minuto (protección contra fuerza bruta)
- Previene ataques DDoS y credential stuffing

### 3. **Helmet (Headers de Seguridad)**

✅ **Configurado**

- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### 4. **SQL Injection**

✅ **Protegido**

- TypeORM usa consultas parametrizadas automáticamente
- Validación de entrada con class-validator

### 5. **XSS (Cross-Site Scripting)**

✅ **Mitigado**

- Sanitización automática de React
- Validación de DTOs con `whitelist: true`
- Headers CSP de Helmet

### 6. **Autenticación JWT**

✅ **Seguro**

- Tokens firmados con algoritmo HS256
- Expiración configurable (default: 7 días)
- Contraseñas hasheadas con bcrypt (10 rounds)

### 7. **HTTPS**

⚠️ **Requerido en Producción**

- Render proporciona HTTPS automático
- Vercel proporciona HTTPS automático
- Supabase usa SSL/TLS

### 8. **Validación de Datos**

✅ **Implementado**

- `ValidationPipe` global
- DTOs con decoradores class-validator
- `whitelist: true` - remueve campos no esperados
- `forbidNonWhitelisted: true` - rechaza campos extras

### 9. **Gestión de Contraseñas**

✅ **Seguro**

- Contraseñas temporales únicas por usuario (primeros 4 + último dígito del RUT)
- Obligatorio cambiar contraseña en primer login
- Bcrypt con 10 rounds de hashing

### 10. **Logs Seguros**

✅ **Configurado**

- En producción: solo `error` y `warn`
- No se registran contraseñas ni tokens
- Logs de CORS bloqueados para auditoría

---

## 🚀 Checklist Pre-Despliegue

### Supabase (Base de Datos)

- [ ] Crear proyecto en Supabase
- [ ] Obtener connection string
- [ ] Habilitar SSL (`DB_SSL=true`)
- [ ] Configurar reglas de firewall (opcional)
- [ ] Crear backup automático

### Render (Backend)

- [ ] Crear Web Service
- [ ] Conectar con repositorio GitHub
- [ ] Build Command: `cd backend && npm install && npm run build`
- [ ] Start Command: `cd backend && npm run start:prod`
- [ ] Configurar variables de entorno (ver arriba)
- [ ] Verificar health check en `/`

### Vercel (Frontend)

- [ ] Crear proyecto Vercel
- [ ] Root Directory: `frontend`
- [ ] Framework Preset: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Configurar `VITE_API_URL`

### GitHub

- [ ] Verificar que `.env` está en `.gitignore`
- [ ] NO commitear secretos
- [ ] Usar `.env.example` como template

---

## 🔐 Mejores Prácticas de Seguridad

### 1. **Gestión de Secretos**

```bash
# ❌ NUNCA hacer esto
git add .env
git commit -m "added env file"

# ✅ SIEMPRE usar variables de entorno en plataforma
# Render > Environment > Add Environment Variable
# Vercel > Settings > Environment Variables
```

### 2. **Rotación de Secretos**

- Cambiar `JWT_SECRET` cada 3-6 meses
- Actualizar contraseña de BD periódicamente
- Rotar credenciales de admin regularmente

### 3. **Monitoreo**

- Revisar logs de Render para intentos fallidos
- Monitorear Supabase para conexiones sospechosas
- Configurar alertas de errores (Sentry opcional)

### 4. **Backups**

- Supabase: backups diarios automáticos
- Exportar datos críticos mensualmente
- Probar restauración de backups

### 5. **Actualización de Dependencias**

```bash
# Backend
cd backend
npm audit
npm audit fix

# Frontend
cd frontend
npm audit
npm audit fix
```

---

## 🚨 En Caso de Brecha de Seguridad

1. **Inmediato**:

   - Cambiar `JWT_SECRET`
   - Invalidar todos los tokens activos
   - Cambiar contraseña de BD

2. **Investigación**:

   - Revisar logs de Render/Supabase
   - Identificar origen del ataque
   - Documentar incidente

3. **Notificación**:

   - Informar a usuarios afectados
   - Obligar cambio de contraseña

4. **Prevención**:
   - Reforzar medidas de seguridad
   - Actualizar documentación
   - Implementar monitoreo adicional

---

## 📋 Comandos Útiles

### Generar JWT Secret Seguro

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Verificar HTTPS

```bash
curl -I https://tu-backend.onrender.com/api
```

### Test Rate Limiting

```bash
for i in {1..10}; do curl https://tu-backend.onrender.com/api/auth/login; done
```

### Verificar CORS

```bash
curl -H "Origin: https://malicioso.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://tu-backend.onrender.com/api/auth/login
```

---

## 📞 Contactos de Emergencia

- **Render Support**: https://render.com/support
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support

---

## ✅ Verificación Final

Antes de lanzar a producción, verificar:

- [ ] Todas las variables de entorno configuradas
- [ ] JWT_SECRET único y seguro generado
- [ ] FRONTEND_URL apunta a dominio correcto
- [ ] DB_SSL=true en variables de Render
- [ ] .env NO está en repositorio
- [ ] HTTPS funcionando en todos los servicios
- [ ] Login funciona correctamente
- [ ] CORS permite solo dominios autorizados
- [ ] Rate limiting activo (probar con múltiples requests)
- [ ] Logs no muestran información sensible
