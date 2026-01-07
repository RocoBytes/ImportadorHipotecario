# 🚀 Guía de Despliegue - Sistema Importador Hipotecario

## 📦 Stack Tecnológico

- **Frontend**: React + Vite + TypeScript (Vercel)
- **Backend**: NestJS + TypeScript (Render)
- **Base de Datos**: PostgreSQL (Supabase)

---

## 1️⃣ Despliegue de Base de Datos (Supabase)

### Paso 1: Crear Proyecto en Supabase

1. Ir a [Supabase](https://supabase.com)
2. Crear cuenta o iniciar sesión
3. Click en "New Project"
4. Configurar:
   - **Name**: importador-hipotecario
   - **Database Password**: (guardar en lugar seguro)
   - **Region**: South America (São Paulo)
5. Esperar ~2 minutos a que se provisione

### Paso 2: Obtener Credenciales

1. En el panel de Supabase, ir a **Settings** > **Database**
2. En "Connection string", seleccionar **URI** y copiar
3. La URL tiene este formato:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Extraer los valores:
   - **DB_HOST**: `db.xxxxx.supabase.co`
   - **DB_PORT**: `5432`
   - **DB_USERNAME**: `postgres`
   - **DB_PASSWORD**: (tu password)
   - **DB_DATABASE**: `postgres`

### Paso 3: Configurar SSL

- **DB_SSL**: `true` (obligatorio para Supabase)

---

## 2️⃣ Despliegue de Backend (Render)

### Paso 1: Preparar Repositorio

1. Asegurarse que el código está en GitHub
2. Verificar que `.env` está en `.gitignore`
3. Verificar estructura:
   ```
   proyecto/
   ├── backend/
   │   ├── src/
   │   ├── package.json
   │   └── tsconfig.json
   └── frontend/
   ```

### Paso 2: Crear Web Service en Render

1. Ir a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** > **"Web Service"**
3. Conectar con GitHub repository
4. Configurar:
   - **Name**: `importador-hipotecario-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start:prod
     ```
   - **Instance Type**: Free

### Paso 3: Configurar Variables de Entorno

En Render, ir a **Environment** y agregar:

```bash
# Base de Datos (copiar de Supabase)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_de_supabase
DB_DATABASE=postgres
DB_SSL=true

# JWT (generar nuevo)
JWT_SECRET=generar_con_comando_abajo
JWT_EXPIRATION=7d

# BCrypt
BCRYPT_ROUNDS=10

# Servidor
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://tu-app.vercel.app
```

**Generar JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Paso 4: Deploy

1. Click en **"Create Web Service"**
2. Esperar ~5-10 minutos al primer deploy
3. Verificar logs: debe mostrar `🚀 Servidor corriendo`
4. Copiar la URL: `https://importador-hipotecario-backend.onrender.com`

### Paso 5: Crear Usuario Admin

1. Ir al SQL Editor de Supabase
2. Ejecutar:
   ```sql
   INSERT INTO users (id, rut, password_hash, rol, must_change_password, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     '1-9',
     '$2b$10$hashed_password_aqui',
     'ADMIN',
     false,
     NOW(),
     NOW()
   );
   ```
3. Para generar el hash de la contraseña "1234":
   ```bash
   node -e "console.log(require('bcrypt').hashSync('1234', 10))"
   ```

---

## 3️⃣ Despliegue de Frontend (Vercel)

### Paso 1: Preparar Proyecto

1. En tu proyecto frontend, actualizar `.env`:
   ```bash
   VITE_API_URL=https://importador-hipotecario-backend.onrender.com/api
   ```

### Paso 2: Desplegar en Vercel

1. Ir a [Vercel](https://vercel.com)
2. Click en **"Add New"** > **"Project"**
3. Importar repositorio de GitHub
4. Configurar:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Paso 3: Variables de Entorno

En Vercel Settings > Environment Variables:

```bash
VITE_API_URL=https://importador-hipotecario-backend.onrender.com/api
```

### Paso 4: Deploy

1. Click en **"Deploy"**
2. Esperar ~2-3 minutos
3. Copiar URL: `https://tu-app.vercel.app`

---

## 4️⃣ Configuración Final

### Actualizar CORS en Backend (Render)

1. Volver a Render > Environment Variables
2. Actualizar `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=https://tu-app.vercel.app
   ```
3. Hacer redeploy del servicio

### Verificar Funcionamiento

1. Abrir `https://tu-app.vercel.app`
2. Login con admin: RUT `1-9`, Password `1234`
3. Subir archivo CSV de prueba
4. Verificar que se importen usuarios y operaciones

---

## 🔧 Comandos de Mantenimiento

### Actualizar Backend (Render)

Render hace auto-deploy con cada push a `main`. Para forzar:

```bash
git push origin main
```

### Actualizar Frontend (Vercel)

Vercel hace auto-deploy con cada push. Para forzar:

```bash
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

### Ver Logs

- **Backend**: Render Dashboard > Logs
- **Database**: Supabase Dashboard > Database > Logs
- **Frontend**: Vercel Dashboard > Deployments > Log Output

### Backup de Base de Datos

```bash
# Desde Supabase Dashboard
Settings > Database > Backups > Download
```

---

## 🐛 Troubleshooting

### Error: "CORS Policy"

- Verificar que `FRONTEND_URL` en Render incluye la URL exacta de Vercel
- Verificar que no hay espacios extra
- Redeploy del backend después de cambiar

### Error: "Cannot connect to database"

- Verificar `DB_SSL=true` en Render
- Verificar credenciales de Supabase
- Verificar que IP de Render está permitida en Supabase (por defecto está abierto)

### Error: "JWT malformed"

- Verificar que `JWT_SECRET` es el mismo en todas las instancias
- Generar nuevo JWT_SECRET y actualizar

### Backend no inicia

- Revisar logs en Render
- Verificar que Build Command se completó sin errores
- Verificar que todas las variables de entorno están configuradas

### Frontend no conecta con Backend

- Verificar `VITE_API_URL` en Vercel
- Verificar que Backend está corriendo (abrir URL en navegador)
- Verificar CORS en Backend

---

## 📊 Monitoreo

### Render (Backend)

- **Métricas**: CPU, Memory, Response Time
- **Alertas**: Configurar notificaciones por email
- **Free Tier**: Se suspende después de 15 minutos de inactividad

### Supabase (Database)

- **Disk Usage**: 500 MB en plan gratuito
- **Bandwidth**: 2 GB/mes en plan gratuito
- **Backups**: Diarios automáticos (7 días retención)

### Vercel (Frontend)

- **Bandwidth**: 100 GB/mes en plan gratuito
- **Build Minutes**: Ilimitado para hobby projects
- **Analytics**: Dashboard de visitas y performance

---

## 💰 Costos

### Plan Gratuito (Recomendado para Inicio)

- **Supabase**: Free (500 MB, 2 GB bandwidth)
- **Render**: Free (750 hrs/mes, se suspende en inactividad)
- **Vercel**: Free (100 GB bandwidth, ilimitadas builds)
- **Total**: $0/mes

### Plan Pro (Para Producción)

- **Supabase**: $25/mes (8 GB, 50 GB bandwidth)
- **Render**: $7/mes (sin suspensión, SSL, 512 MB RAM)
- **Vercel**: $20/mes (1 TB bandwidth, analytics)
- **Total**: ~$52/mes

---

## 📝 Checklist de Despliegue

- [ ] Supabase proyecto creado
- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] CORS actualizado con URL de Vercel
- [ ] Usuario admin creado en BD
- [ ] Login funciona correctamente
- [ ] CSV se importa correctamente
- [ ] Vendedores pueden ver sus operaciones
- [ ] Exportar a Excel funciona
- [ ] Rate limiting probado
- [ ] HTTPS verificado en todos los servicios
- [ ] Documentación de seguridad revisada

---

## 🎉 ¡Listo!

Tu aplicación está ahora en producción. Recuerda:

1. **Seguridad**: Revisar `SEGURIDAD.md` regularmente
2. **Backups**: Hacer backups manuales mensuales
3. **Actualizaciones**: Mantener dependencias actualizadas
4. **Monitoreo**: Revisar logs semanalmente

**URLs Importantes:**

- Frontend: `https://tu-app.vercel.app`
- Backend: `https://importador-hipotecario-backend.onrender.com`
- Database: Supabase Dashboard

**Credenciales Admin:**

- RUT: `1-9`
- Password: `1234` (cambiar después del primer login)
