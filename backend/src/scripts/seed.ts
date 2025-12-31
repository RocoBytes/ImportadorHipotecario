import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/entities/user.entity';

/**
 * Script Seed para crear el primer usuario ADMIN
 * 
 * Ejecutar con: npm run seed
 * 
 * Credenciales por defecto:
 * - RUT: 1-9
 * - Password: 1234
 * - Rol: ADMIN
 */

async function seed() {
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
    console.log('📦 Conexión a la base de datos establecida');

    const userRepository = dataSource.getRepository(User);

    // Verificar si el usuario admin ya existe
    const existingAdmin = await userRepository.findOne({
      where: { rut: '1-9' },
    });

    if (existingAdmin) {
      console.log('⚠️  El usuario admin ya existe');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   RUT: ${existingAdmin.rut}`);
      console.log(`   Rol: ${existingAdmin.rol}`);
      await dataSource.destroy();
      return;
    }

    // Hashear contraseña
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash('1234', bcryptRounds);

    // Crear usuario admin
    const admin = userRepository.create({
      rut: '1-9',
      passwordHash,
      rol: UserRole.ADMIN,
      mustChangePassword: true,
    });

    await userRepository.save(admin);

    console.log('✅ Usuario ADMIN creado exitosamente');
    console.log('');
    console.log('📋 Credenciales:');
    console.log('   RUT: 1-9');
    console.log('   Password: 1234');
    console.log('   Rol: ADMIN');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error al ejecutar el seed:', (error as Error).message);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Ejecutar seed
seed();
