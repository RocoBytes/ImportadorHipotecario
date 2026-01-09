# 🔧 Fix: Connection Timeout en Render

## 🚨 Problema Identificado

```
Query read timeout
Connection terminated due to connection timeout
```

## ✅ Solución Aplicada

### 1️⃣ Verificar Estado de Supabase (CRÍTICO)

1. **Ir a:** https://supabase.com/dashboard/project/_
2. **Verificar:** Si el proyecto está en estado "PAUSED" (pausado)
3. **Acción:** Click en botón **"Resume"** y esperar 1-2 minutos

> ⚠️ **Supabase Free Tier** pausa proyectos automáticamente después de 7 días de inactividad.

---

### 2️⃣ Cambiar Connection String en Render

Necesitas cambiar a **Session Pooler** (más estable):

#### Variables de Entorno en Render:

**Opción A: Session Pooler (RECOMENDADO para login/queries simples)**

```bash
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_USERNAME=postgres.tu_project_ref
DB_PASSWORD=tu_password_aqui
DB_DATABASE=postgres
DB_SSL=true
```

**Opción B: Transaction Pooler (para imports masivos)**

```bash
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543  # Puerto diferente
DB_USERNAME=postgres.tu_project_ref
DB_PASSWORD=tu_password_aqui
DB_DATABASE=postgres
DB_SSL=true
```

#### ¿Cómo obtener estos valores?

1. **Supabase Dashboard** → Settings → Database
2. **Connection String** → Seleccionar **"Session Pooler"**
3. **Copiar** los valores:
   ```
   Host: aws-0-us-east-1.pooler.supabase.com
   Database: postgres
   Port: 5432 (Session) o 6543 (Transaction)
   User: postgres.<project_ref>
   Password: [tu_password]
   ```

---

### 3️⃣ Cambios Aplicados en database.config.ts

```typescript
// ✅ Timeouts aumentados de 30s → 60-120s
connectionTimeoutMillis: 60000; // 60 segundos
query_timeout: 120000; // 2 minutos (cold start)
statement_timeout: 120000; // 2 minutos

// ✅ Pool optimizado para Session pooler
max: 5; // Más conexiones permitidas
keepAlive: true; // Mantener conexión viva

// ✅ Más reintentos para wake-up
retryAttempts: 10; // Era 5
retryDelay: 3000; // Más rápido (era 5000)
```

---

### 4️⃣ Orden de Ejecución para Resolver

**Paso 1:** Verificar Supabase activo

```bash
# Dashboard: https://supabase.com/dashboard
# Si pausado → Resume → Esperar 1-2 min
```

**Paso 2:** Actualizar variables en Render

```bash
# Dashboard: https://dashboard.render.com
# Environment → Edit → Cambiar DB_PORT a 5432 (Session pooler)
# Save Changes → Esperar redeploy automático (~2 min)
```

**Paso 3:** Commit y push cambios

```bash
cd /Users/rodrigocontrerasrubio/proyectos/importadorHipotecario
git add backend/src/config/database.config.ts
git commit -m "Fix: Increase connection timeouts for Supabase wake-up"
git push
```

**Paso 4:** Monitorear logs en Render

```bash
# Render Dashboard → Logs
# Buscar: "Database connection successful" o nuevos errores
```

---

## 🔍 Diagnóstico Adicional

### ¿Cómo saber si Supabase está pausado?

1. **Síntomas:**

   - Timeouts de 30+ segundos
   - Error: "Connection terminated due to connection timeout"
   - Primer request después de inactividad falla

2. **Confirmación:**

   - Dashboard muestra estado "PAUSED"
   - Queries en SQL Editor no responden

3. **Solución:**
   - Resume project
   - Primera conexión toma 30-60 segundos (wake-up)
   - Conexiones subsecuentes: normales (~200ms)

---

## 📊 Comparación: Session vs Transaction Pooler

| Feature         | Session Pooler (5432)  | Transaction Pooler (6543) |
| --------------- | ---------------------- | ------------------------- |
| **Estabilidad** | ✅ Alta                | ⚠️ Media                  |
| **Timeout**     | ✅ Mejor               | ⚠️ Más sensible           |
| **Pool size**   | ✅ 5-10 conexiones     | ⚠️ 2-3 conexiones         |
| **Uso ideal**   | Login, queries simples | Imports masivos, bulk ops |
| **Cold start**  | ✅ Más rápido          | ⚠️ Más lento              |
| **Recomendado** | ✅ **SÍ para tu caso** | Solo si muchos imports    |

---

## ✅ Testing Después del Fix

### Test 1: Connection Health

```bash
curl https://importador-hipotecario-backend.onrender.com/api
# Esperado: {"message":"API is running"}
```

### Test 2: Login

```bash
curl -X POST https://importador-hipotecario-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"12345678-9","password":"admin123"}'
# Esperado: {"accessToken":"...","user":{...}}
```

### Test 3: Logs de Render

```bash
# Buscar en logs:
✅ "Database connection successful"
✅ "NestApplication successfully started"
❌ "Query read timeout"
❌ "Connection terminated"
```

---

## 🚀 Próximos Pasos

1. ✅ **Resume Supabase** (si está pausado)
2. ✅ **Cambiar a Session pooler** (puerto 5432)
3. ✅ **Commit cambios** del database.config.ts
4. ⏳ **Esperar redeploy** de Render (~2 min)
5. ⏳ **Probar login** en frontend

---

## 💡 Prevención Futura

**Para evitar que Supabase se pause:**

1. **Ping automático:** Crear cron job que haga query cada 6 días
2. **Upgrade a Pro:** $25/mes → Sin auto-pause
3. **Migrar a Neon:** Alternativa sin pause en free tier
4. **Railway.app:** Otra alternativa estable

---

_Generado: Enero 9, 2026_  
_Cambios aplicados en: database.config.ts_
