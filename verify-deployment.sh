#!/bin/bash

# Script de Verificación Pre-Deployment
# Verifica que todo esté listo para desplegar en producción

echo "🚀 Verificación Pre-Deployment - Sistema Importador Hipotecario"
echo "================================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ((errors++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((warnings++))
}

# 1. Verificar que estamos en el directorio correcto
echo "📁 Verificando estructura de proyecto..."
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Estructura de proyecto correcta${NC}"
echo ""

# 2. Verificar Backend
echo "🔧 Verificando Backend..."
cd backend || exit

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules no encontrado. Instalando...${NC}"
    npm install
fi

# Verificar dependencias de seguridad
echo "  Verificando dependencias de seguridad..."
npm list helmet > /dev/null 2>&1
check "helmet instalado"

npm list @nestjs/throttler > /dev/null 2>&1
check "@nestjs/throttler instalado"

npm list bcrypt > /dev/null 2>&1
check "bcrypt instalado"

npm list class-validator > /dev/null 2>&1
check "class-validator instalado"

# Verificar .env
echo "  Verificando configuración..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env no encontrado${NC}"
    ((errors++))
else
    echo -e "${GREEN}✅ .env existe${NC}"
    
    # Verificar JWT_SECRET
    if grep -q "JWT_SECRET=secreto_super_seguro" .env; then
        echo -e "${RED}❌ JWT_SECRET es el valor por defecto (INSEGURO)${NC}"
        ((errors++))
    elif grep -q "JWT_SECRET=GENERA_TU_SECRET" .env; then
        echo -e "${RED}❌ JWT_SECRET no ha sido generado${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✅ JWT_SECRET parece estar configurado${NC}"
    fi
fi

# Verificar que .env está en .gitignore
if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✅ .env en .gitignore${NC}"
else
    echo -e "${RED}❌ .env NO está en .gitignore (CRÍTICO)${NC}"
    ((errors++))
fi

# Ejecutar security check
echo "  Ejecutando verificación de seguridad..."
npm run security:check > /dev/null 2>&1
check "Verificación de seguridad"

# Compilar backend
echo "  Compilando backend..."
npm run build > /dev/null 2>&1
check "Backend compila correctamente"

cd ..
echo ""

# 3. Verificar Frontend
echo "🎨 Verificando Frontend..."
cd frontend || exit

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules no encontrado. Instalando...${NC}"
    npm install
fi

# Verificar .env
echo "  Verificando configuración..."
if [ ! -f ".env" ]; then
    warn ".env no encontrado (usar valores por defecto)"
else
    echo -e "${GREEN}✅ .env existe${NC}"
fi

# Compilar frontend
echo "  Compilando frontend..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend compila correctamente${NC}"
else
    echo -e "${RED}❌ Frontend no compila${NC}"
    ((errors++))
fi

cd ..
echo ""

# 4. Verificar archivos de deployment
echo "📄 Verificando archivos de deployment..."

files=(
    "backend/.env.example"
    "backend/.gitignore"
    "frontend/.gitignore"
    "frontend/vercel.json"
    "DEPLOYMENT_CHECKLIST.md"
    "DEPLOYMENT_READY.md"
    "SEGURIDAD.md"
    "DESPLIEGUE.md"
    "backend/README.deployment.md"
    "frontend/README.deployment.md"
    "backend/scripts/verify-security.js"
    "backend/scripts/generate-jwt-secret.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file no encontrado${NC}"
        ((errors++))
    fi
done

echo ""

# 5. Verificar Git
echo "🔍 Verificando Git..."

# Verificar que no hay .env en staging
if git ls-files | grep -q "\.env$"; then
    echo -e "${RED}❌ .env está en Git (CRÍTICO - NO DEBE SUBIRSE)${NC}"
    ((errors++))
else
    echo -e "${GREEN}✅ .env no está en Git${NC}"
fi

# Verificar cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    warn "Hay cambios sin commitear"
    echo "  Archivos modificados:"
    git status --short | head -5
    if [ $(git status --short | wc -l) -gt 5 ]; then
        echo "  ... y más"
    fi
else
    echo -e "${GREEN}✅ No hay cambios sin commitear${NC}"
fi

echo ""

# Resumen
echo "================================================================="
echo "📊 RESUMEN DE VERIFICACIÓN"
echo "================================================================="
echo ""

if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡PERFECTO! Sistema listo para deployment${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Revisar DEPLOYMENT_CHECKLIST.md"
    echo "2. Crear proyecto en Supabase"
    echo "3. Desplegar backend en Render"
    echo "4. Desplegar frontend en Vercel"
    echo "5. Actualizar FRONTEND_URL en Render"
    echo ""
    exit 0
elif [ $errors -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ADVERTENCIAS ENCONTRADAS${NC}"
    echo "Advertencias: $warnings"
    echo ""
    echo "Puedes continuar con el deployment, pero revisa las advertencias."
    echo ""
    exit 0
else
    echo -e "${RED}❌ ERRORES CRÍTICOS ENCONTRADOS${NC}"
    echo "Errores: $errors"
    echo "Advertencias: $warnings"
    echo ""
    echo "Por favor, corrige los errores antes de desplegar."
    echo ""
    exit 1
fi
