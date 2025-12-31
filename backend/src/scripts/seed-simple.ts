import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/entities/user.entity';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Script alternativo de Seed usando conexión directa
 * 
 * Ejecutar con: ts-node -r tsconfig-paths/register src/scripts/seed-simple.ts
 */

async function seedSimple() {
  console.log('🌱 Iniciando seed de usuario admin...');

  // Crear conexión a la base de datos
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_DATABASE || 'mutuos_db',
    entities: [User],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión establecida');

    const userRepository = dataSource.getRepository(User);

    // Verificar si ya existe
    const existing = await userRepository.findOne({
      where: { rut: '1-9' },
    });

    if (existing) {
      console.log('');
      console.log('⚠️  El usuario admin ya existe:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   RUT: ${existing.rut}`);
      console.log(`   Rol: ${existing.rol}`);
      console.log(`   Debe cambiar password: ${existing.mustChangePassword ? 'Sí' : 'No'}`);
      console.log('');
      
      // Preguntar si desea actualizar la contraseña
      console.log('💡 Si olvidaste la contraseña, puedes eliminar el usuario y ejecutar el seed nuevamente');
      
      await dataSource.destroy();
      return;
    }

    // Hashear contraseña '1234'
    const passwordHash = await bcrypt.hash('1234', 10);

    // Crear admin
    const admin = userRepository.create({
      rut: '1-9',
      passwordHash,
      rol: UserRole.ADMIN,
      mustChangePassword: true,
    });

    const saved = await userRepository.save(admin);

    console.log('');
    console.log('✅ ¡Usuario ADMIN creado exitosamente!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📋 CREDENCIALES DE ACCESO');
    console.log('═══════════════════════════════════════');
    console.log(`   ID:       ${saved.id}`);
    console.log(`   RUT:      1-9`);
    console.log(`   Password: 1234`);
    console.log(`   Rol:      ADMIN`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   • Cambia la contraseña después del primer login');
    console.log('   • Usa POST /api/auth/login para obtener el token JWT');
    console.log('   • El sistema te obligará a cambiar la contraseña');
    console.log('');

    await dataSource.destroy();
    console.log('🔒 Conexión cerrada');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', (error as Error).message);
    console.error('');
    console.error('Verifica que:');
    console.error('  1. PostgreSQL esté corriendo');
    console.error('  2. La base de datos existe');
    console.error('  3. Las credenciales en .env sean correctas');
    console.error('  4. Las tablas estén creadas (ejecuta schema.sql)');
    console.error('');
    
    await dataSource.destroy();
    process.exit(1);
  }
}

// Ejecutar
seedSimple();
