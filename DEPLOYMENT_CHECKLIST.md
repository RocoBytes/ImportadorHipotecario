# ✅ Checklist Final de Deployment

**Fecha:** 8 de enero de 2026  
**Estado:** Pre-producción

---

## 📋 Verificación Completa

### ✅ 1. Compilación

- [x] **Backend compila:** `npm run build` exitoso
- [x] **Frontend compila:** `npm run build` exitoso
- [x] **Sin errores TypeScript**
- [x] **Sin warnings críticos**

### ✅ 2. Seguridad

- [x] **JWT_SECRET seguro:** 128 caracteres hexadecimales
- [x] **Script de verificación:** `npm run security:check` pasa
- [x] **.env en .gitignore:** Verificado
- [x] **Sin credenciales hardcodeadas:** Verificado
- [x] **Helmet configurado:** Headers de seguridad activos
- [x] **Rate limiting:** 100 req/min global, 5 req/min login
- [x] **CORS configurado:** Validación de origen
- [x] **Bcrypt:** Contraseñas hasheadas
- [x] **Class-validator:** DTOs validados

### ✅ 3. Archivos de Configuración

- [x] **backend/.env.example:** Completo con instrucciones
- [x] **frontend/.env:** Configurado
- [x] **vercel.json:** Creado para frontend
- [x] **README.deployment.md:** Creado para backend y frontend
- [x] **.gitignore:** Configurado correctamente

### ✅ 4. Documentación

- [x] **Swagger configurado:** `/api/docs` disponible
- [x] **SEGURIDAD.md:** Guía completa
- [x] **DESPLIEGUE.md:** Instrucciones paso a paso
- [x] **SEGURIDAD_AUDIT.md:** Auditoría de seguridad
- [x] **Scripts README:** Documentación de scripts

### ✅ 5. Base de Datos

- [x] **schema.sql:** Existe y está actualizado
- [x] **TypeORM configurado:** SSL condicional
- [x] **Migraciones:** No usa auto-sync (seguro)
- [x] **Configuración flexible:** Local vs Producción

### ✅ 6. Scripts NPM

**Backend:**

- [x] `npm run build` - Build producción
- [x] `npm run start:prod` - Start producción
- [x] `npm run security:check` - Verificar seguridad
- [x] `npm run generate:secret` - Generar JWT_SECRET
- [x] `npm run seed` - Crear usuario admin

**Frontend:**

- [x] `npm run build` - Build producción
- [x] `npm run dev` - Desarrollo
- [x] `npm run preview` - Preview build

---

## 🚀 Pasos para Despliegue

### 1. Supabase (Base de Datos)

```bash
# En Supabase Dashboard:
1. Crear proyecto nuevo
2. Ir a Settings → Database
3. Copiar Connection String
4. Ejecutar schema.sql en SQL Editor
5. Guardar credenciales
```

**Variables obtenidas:**

- `DB_HOST`: db.xxxxxxxxx.supabase.co
- `DB_USERNAME`: postgres
- `DB_PASSWORD`: [tu password]
- `DB_DATABASE`: postgres
- `DB_PORT`: 5432
- `DB_SSL`: true

---

### 2. Render (Backend)

```bash
# En Render Dashboard:
1. New → Web Service
2. Conectar repositorio GitHub
3. Configurar:
   - Name: importador-hipotecario-backend
   - Region: Oregon (US West)
   - Branch: main
   - Root Directory: backend
   - Runtime: Node
   - Build Command: npm install && npm run build
   - Start Command: npm run start:prod
```

**Environment Variables:**

```bash
DB_HOST=db.xxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[tu_password_supabase]
DB_DATABASE=postgres
DB_SSL=true

# Generar nuevo JWT_SECRET para producción
JWT_SECRET=[ejecutar: npm run generate:secret]
JWT_EXPIRATION=7d

NODE_ENV=production
PORT=10000
FRONTEND_URL=https://tu-app.vercel.app
MAX_FILE_SIZE=10485760
```

**⚠️ IMPORTANTE:**

- Genera un JWT_SECRET DIFERENTE al de desarrollo
- NO uses el mismo JWT_SECRET en desarrollo y producción

---

### 3. Vercel (Frontend)

```bash
# En Vercel Dashboard:
1. Add New → Project
2. Import Git Repository
3. Configurar:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build (automático)
   - Output Directory: dist (automático)
```

**Environment Variables:**

```bash
# Usar URL de tu backend en Render
VITE_API_URL=https://importador-hipotecario-backend.onrender.com/api
```

**⚠️ IMPORTANTE:**

- Después del primer deploy, Vercel te dará una URL
- Copia esa URL y actualiza `FRONTEND_URL` en Render

---

### 4. Actualizar CORS (Crítico)

Después de desplegar en Vercel:

1. Ve a Render → tu servicio → Environment
2. Actualiza `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=https://tu-app.vercel.app,https://www.tu-app.vercel.app
   ```
3. Redeploy el backend

---

### 5. Crear Usuario Admin

```bash
# Opción A: Script seed (recomendado)
# Conectarse por SSH a Render y ejecutar:
npm run seed

# Opción B: Crear manualmente en Supabase SQL Editor
# Ver script en backend/src/scripts/seed-simple.ts
```

**Credenciales admin por defecto:**

- RUT: `12345678-9`
- Password: `1234`
- **⚠️ Cambiar inmediatamente después del primer login**

---

### 6. Verificación Post-Deployment

#### Backend (Render)

```bash
# 1. Verificar que el servicio está activo
curl https://tu-backend.onrender.com/api

# 2. Verificar Swagger
# Abrir en navegador:
https://tu-backend.onrender.com/api/docs

# 3. Test de login
curl -X POST https://tu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"12345678-9","password":"1234"}'
```

#### Frontend (Vercel)

```bash
# 1. Abrir en navegador
https://tu-app.vercel.app

# 2. Verificar login
# Usar credenciales admin

# 3. Verificar que puede hacer requests al backend
# Intentar importar CSV
```

---

## 🔍 Troubleshooting

### Error: CORS Blocked

**Síntoma:** Frontend no puede conectarse al backend

**Solución:**

1. Verifica `FRONTEND_URL` en Render incluye tu dominio de Vercel
2. Asegúrate de usar HTTPS en producción
3. Redeploy backend después de cambiar variables

### Error: JWT Invalid

**Síntoma:** Login funciona pero luego dice "No autenticado"

**Solución:**

1. Verifica que `JWT_SECRET` sea el mismo en todos los servidores de Render
2. Si cambiaste `JWT_SECRET`, todos deben volver a loguearse

### Error: Database Connection

**Síntoma:** Backend no puede conectarse a Supabase

**Solución:**

1. Verifica credenciales en Render
2. Asegúrate de que `DB_SSL=true`
3. Verifica que Supabase no tenga pausada la base de datos

### Error: Build Failed (Render)

**Síntoma:** Build falla en Render

**Solución:**

```bash
# Localmente, verifica que compile:
cd backend
npm install
npm run build

# Si falla, revisa errores TypeScript
```

### Error: Build Failed (Vercel)

**Síntoma:** Build falla en Vercel

**Solución:**

```bash
# Localmente, verifica que compile:
cd frontend
npm install
npm run build

# Si falla, revisa errores TypeScript
```

---

## 📊 Métricas de Éxito

Después del deployment, verifica:

- [ ] ✅ Backend responde en Render
- [ ] ✅ Frontend carga en Vercel
- [ ] ✅ Login funciona
- [ ] ✅ Dashboard de admin carga
- [ ] ✅ Importación de CSV funciona
- [ ] ✅ Dashboard de vendedor muestra operaciones
- [ ] ✅ Exportación a Excel funciona
- [ ] ✅ Cambio de contraseña funciona
- [ ] ✅ Swagger accesible
- [ ] ✅ Sin errores de CORS
- [ ] ✅ Sin errores 500 en backend

---

## 🔐 Post-Deployment Security

### Inmediato (Día 1)

- [ ] Cambiar contraseña del usuario admin
- [ ] Verificar que JWT_SECRET de producción es diferente al de desarrollo
- [ ] Confirmar que .env no está en Git
- [ ] Revisar logs de Render por errores

### Primera Semana

- [ ] Monitorear logs de seguridad
- [ ] Verificar que rate limiting funciona
- [ ] Revisar usuarios creados
- [ ] Backup de base de datos

### Mensual

- [ ] Ejecutar `npm audit` y actualizar dependencias
- [ ] Revisar logs de acceso
- [ ] Backup de base de datos
- [ ] Rotar JWT_SECRET si es necesario

---

## 📞 Contacto

**Desarrollador:** Rodrigo Contreras  
**Fecha Checklist:** 8 de enero de 2026  
**Última Actualización:** 8 de enero de 2026

---

## 🎉 ¡Listo para Producción!

Si todos los checkboxes están marcados, tu aplicación está lista para desplegarse en producción.

**Comando final de verificación:**

```bash
cd backend && npm run security:check && npm run build
cd ../frontend && npm run build
echo "✅ Todo listo para deployment"
```
