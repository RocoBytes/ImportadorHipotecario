#!/usr/bin/env node

/**
 * Generador de JWT_SECRET Seguro
 * Genera un secret criptográficamente seguro de 128 caracteres hexadecimales
 */

const crypto = require('crypto');
const readline = require('readline');

console.log('\n🔐 Generador de JWT_SECRET Seguro\n');
console.log('=' .repeat(70));

// Generar secret
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ JWT_SECRET generado exitosamente:\n');
console.log('━'.repeat(70));
console.log(secret);
console.log('━'.repeat(70));

console.log('\n📋 Instrucciones:\n');
console.log('1. Copia el secret de arriba (128 caracteres hexadecimales)');
console.log('2. Pégalo en tu archivo .env:');
console.log('   JWT_SECRET=<secret-copiado-aqui>');
console.log('\n3. Para producción en Render:');
console.log('   - Ve a Dashboard → tu-servicio → Environment');
console.log('   - Agrega variable: JWT_SECRET = <secret-copiado>');
console.log('   - Guarda y redeploy');

console.log('\n⚠️  IMPORTANTE:');
console.log('   • NUNCA uses el mismo secret en desarrollo y producción');
console.log('   • NUNCA compartas este secret en Git o repositorios públicos');
console.log('   • NUNCA envíes este secret por correo o mensajería sin cifrar');
console.log('   • Guárdalo en un gestor de contraseñas seguro');

console.log('\n💡 Tip: Para generar otro, ejecuta:');
console.log('   npm run generate:secret');

console.log('\n' + '='.repeat(70) + '\n');

// Preguntar si desea actualizar el .env automáticamente
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Deseas actualizar automáticamente el archivo .env? (s/N): ', (answer) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('\n❌ Archivo .env no encontrado');
      rl.close();
      return;
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Reemplazar JWT_SECRET
    const jwtSecretRegex = /JWT_SECRET=.*/;
    if (jwtSecretRegex.test(envContent)) {
      envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET=${secret}`);
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ .env actualizado correctamente');
      console.log('⚠️  Recuerda: Los usuarios actuales deberán volver a autenticarse');
    } else {
      console.log('\n⚠️  JWT_SECRET no encontrado en .env. Agrégalo manualmente.');
    }
  } else {
    console.log('\n👍 Recuerda copiar el secret manualmente a tu .env');
  }
  
  rl.close();
});
