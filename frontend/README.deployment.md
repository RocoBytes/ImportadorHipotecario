# Frontend - Sistema Importador Hipotecario

Frontend del Sistema Importador Hipotecario construido con React + Vite + TypeScript.

## 🚀 Despliegue en Vercel

### Variables de Entorno Requeridas

```bash
# URL del backend en Render
VITE_API_URL=https://tu-backend.onrender.com/api
```

### Configuración de Vercel

1. Importa tu repositorio de GitHub
2. Framework Preset: **Vite**
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Configura variable de entorno `VITE_API_URL`
7. Deploy

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Preview producción
npm run preview
```

## 📦 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo (puerto 5173)
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linting

## 🌐 URLs

- **Desarrollo:** http://localhost:5173
- **Producción:** https://tu-app.vercel.app

## ⚙️ Configuración

### Variables de Entorno

Archivo: `.env`

```bash
# URL del backend
VITE_API_URL=http://localhost:3000/api  # Desarrollo
# VITE_API_URL=https://tu-backend.onrender.com/api  # Producción
```

### CORS

Asegúrate de que tu backend incluya la URL de Vercel en `FRONTEND_URL`:

```bash
# En Render (backend)
FRONTEND_URL=https://tu-app.vercel.app,https://www.tu-app.vercel.app
```

## 📱 Features

- ✅ Dashboard de administrador
- ✅ Dashboard de vendedor
- ✅ Importación de CSV
- ✅ Exportación a Excel
- ✅ Cambio de contraseña
- ✅ Autenticación JWT
- ✅ Rate limiting
- ✅ Responsive design

## 🔒 Seguridad

- Tokens JWT en localStorage
- Logout automático en 401
- Validación de formularios
- HTTPS en producción (Vercel)

## 🐛 Troubleshooting

### Error de CORS

Si ves errores de CORS en producción:

1. Verifica que `VITE_API_URL` esté configurado en Vercel
2. Verifica que `FRONTEND_URL` incluya tu dominio de Vercel en el backend
3. Asegúrate de usar HTTPS

### Build Warnings

El warning sobre chunks grandes es normal para esta aplicación. Si quieres optimizarlo:

```bash
npm install --save-dev @rollup/plugin-dynamic-import-vars
```

Luego configura code-splitting en `vite.config.ts`.

## 📞 Soporte

Para problemas de despliegue, revisa:

- [DESPLIEGUE.md](../DESPLIEGUE.md) - Guía de despliegue completa
