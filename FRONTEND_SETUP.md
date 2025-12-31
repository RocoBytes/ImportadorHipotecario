# 🎨 Comandos de Instalación - Frontend React + Vite

## 1. Crear proyecto con Vite + React + TypeScript

```bash
# Desde la raíz del proyecto
npm create vite@latest frontend -- --template react-ts

# Entrar al directorio
cd frontend
```

## 2. Instalar dependencias principales

```bash
# Dependencias de producción
npm install axios react-router-dom lucide-react

# TailwindCSS y dependencias
npm install -D tailwindcss postcss autoprefixer

# Inicializar TailwindCSS
npx tailwindcss init -p
```

## 3. Comando único (todas las dependencias)

```bash
npm install axios react-router-dom lucide-react && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

## 4. Configurar TailwindCSS

Edita `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## 5. Configurar estilos globales

Edita `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 6. Configurar variables de entorno

```bash
# Crear archivo .env
touch .env
```

Contenido del `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## 7. Ejecutar en desarrollo

```bash
npm run dev
```

El frontend estará en: `http://localhost:5173`

## Estructura esperada

```
frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   └── api.ts
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── .env.example
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── package.json
```
