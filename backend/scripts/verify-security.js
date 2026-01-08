#!/usr/bin/env node

/**
 * Script de Verificación de Seguridad
 * Valida que las configuraciones críticas de seguridad estén correctas antes de despliegue
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Verificación de Seguridad - Sistema Importador Hipotecario\n');
console.log('=' .repeat(70));

let errors = 0;
let warnings = 0;
let passed = 0;

// Función auxiliar para verificar
function check(condition, successMsg, errorMsg, isWarning = false) {
  if (condition) {
    console.log(`✅ ${successMsg}`);
    passed++;
    return true;
  } else {
    if (isWarning) {
      console.log(`⚠️  ${errorMsg}`);
      warnings++;
    } else {
      console.log(`❌ ${errorMsg}`);
      errors++;
    }
    return false;
  }
}

// Cargar .env
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ Archivo .env no encontrado');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

console.log('\n📋 Verificando Configuraciones Críticas:\n');

// 1. JWT_SECRET
console.log('1. JWT_SECRET:');
const jwtSecret = envVars.JWT_SECRET;
if (jwtSecret) {
  check(
    jwtSecret.length >= 64,
    `JWT_SECRET tiene longitud segura (${jwtSecret.length} caracteres)`,
    `JWT_SECRET muy corto (${jwtSecret.length} caracteres). Mínimo: 64`,
    false
  );
  
  check(
    !/secreto|password|change|produccion|example/i.test(jwtSecret),
    'JWT_SECRET no contiene palabras débiles',
    'JWT_SECRET contiene palabras débiles o de ejemplo',
    false
  );
  
  check(
    /^[a-f0-9]{128}$/.test(jwtSecret),
    'JWT_SECRET es un hash hexadecimal de 128 caracteres (óptimo)',
    'JWT_SECRET no es un hash hexadecimal estándar',
    true
  );
} else {
  console.log('❌ JWT_SECRET no definido');
  errors++;
}

// 2. NODE_ENV
console.log('\n2. NODE_ENV:');
const nodeEnv = envVars.NODE_ENV || 'development';
check(
  ['development', 'production', 'test'].includes(nodeEnv),
  `NODE_ENV configurado correctamente: ${nodeEnv}`,
  `NODE_ENV tiene valor no estándar: ${nodeEnv}`,
  true
);

// 3. DB_SSL
console.log('\n3. Database SSL:');
const dbSsl = envVars.DB_SSL;
if (nodeEnv === 'production') {
  check(
    dbSsl === 'true',
    'DB_SSL habilitado para producción',
    'DB_SSL debería estar en "true" para producción',
    false
  );
} else {
  check(
    dbSsl === 'false',
    'DB_SSL deshabilitado para desarrollo (correcto)',
    'DB_SSL configurado',
    true
  );
}

// 4. FRONTEND_URL
console.log('\n4. CORS - FRONTEND_URL:');
const frontendUrl = envVars.FRONTEND_URL;
if (frontendUrl) {
  check(
    frontendUrl.includes('http'),
    `FRONTEND_URL configurado: ${frontendUrl}`,
    'FRONTEND_URL no contiene protocolo HTTP/HTTPS',
    true
  );
  
  if (nodeEnv === 'production') {
    check(
      frontendUrl.includes('https://'),
      'FRONTEND_URL usa HTTPS en producción',
      'FRONTEND_URL debería usar HTTPS en producción',
      false
    );
    
    check(
      !frontendUrl.includes('localhost'),
      'FRONTEND_URL no apunta a localhost en producción',
      'FRONTEND_URL apunta a localhost en producción',
      false
    );
  }
} else {
  console.log('⚠️  FRONTEND_URL no definido (se usarán valores por defecto)');
  warnings++;
}

// 5. JWT_EXPIRATION
console.log('\n5. JWT Expiración:');
const jwtExpiration = envVars.JWT_EXPIRATION || envVars.JWT_EXPIRES_IN;
if (jwtExpiration) {
  check(
    /^\d+[dhms]$/.test(jwtExpiration) || !isNaN(jwtExpiration),
    `JWT expira en: ${jwtExpiration}`,
    `JWT_EXPIRATION tiene formato inválido: ${jwtExpiration}`,
    true
  );
  
  // Advertir si expira en más de 30 días
  const daysMatch = jwtExpiration.match(/^(\d+)d$/);
  if (daysMatch && parseInt(daysMatch[1]) > 30) {
    console.log(`⚠️  JWT_EXPIRATION muy largo (${jwtExpiration}). Recomendado: máx 30d`);
    warnings++;
  }
} else {
  console.log('⚠️  JWT_EXPIRATION no definido');
  warnings++;
}

// 6. Verificar que .env NO esté en Git
console.log('\n6. Git Security:');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  check(
    gitignoreContent.includes('.env'),
    '.env está en .gitignore (correcto)',
    '.env NO está en .gitignore - CRÍTICO',
    false
  );
} else {
  console.log('⚠️  .gitignore no encontrado');
  warnings++;
}

// 7. Verificar package.json para dependencias de seguridad
console.log('\n7. Dependencias de Seguridad:');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = packageJson.dependencies || {};
  
  check(
    !!deps['helmet'],
    'helmet instalado ✓',
    'helmet NO instalado',
    false
  );
  
  check(
    !!deps['@nestjs/throttler'],
    '@nestjs/throttler instalado ✓',
    '@nestjs/throttler NO instalado',
    false
  );
  
  check(
    !!deps['bcrypt'],
    'bcrypt instalado ✓',
    'bcrypt NO instalado',
    false
  );
  
  check(
    !!deps['class-validator'],
    'class-validator instalado ✓',
    'class-validator NO instalado',
    false
  );
}

// Resumen
console.log('\n' + '='.repeat(70));
console.log('\n📊 RESUMEN DE VERIFICACIÓN:\n');
console.log(`✅ Verificaciones exitosas: ${passed}`);
console.log(`⚠️  Advertencias:            ${warnings}`);
console.log(`❌ Errores críticos:        ${errors}`);

console.log('\n' + '='.repeat(70));

if (errors > 0) {
  console.log('\n🔴 RESULTADO: FALLÓ - Corrige los errores críticos antes de desplegar\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n🟡 RESULTADO: ADVERTENCIAS - Revisa las advertencias antes de desplegar\n');
  process.exit(0);
} else {
  console.log('\n🟢 RESULTADO: APROBADO - Configuración de seguridad correcta\n');
  process.exit(0);
}
