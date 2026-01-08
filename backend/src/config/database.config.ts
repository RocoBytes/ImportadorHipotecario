import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Configuración de TypeORM con soporte para Local y Producción
 * 
 * SSL condicional:
 * - Local: DB_SSL=false (sin SSL)
 * - Producción (Render/Supabase): DB_SSL=true (con SSL)
 */
export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isSSL = process.env.DB_SSL === 'true';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_DATABASE || 'mutuos_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // IMPORTANTE: Usar schema.sql en lugar de auto-sync
    logging: process.env.NODE_ENV !== 'production',
    
    // Configuración SSL condicional
    ssl: isSSL
      ? {
          rejectUnauthorized: false, // Necesario para algunos proveedores cloud
        }
      : false,

    // Pool de conexiones
    extra: {
      max: 10, // Máximo de conexiones
      min: 2,  // Mínimo de conexiones
      idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexiones inactivas
      // Forzar IPv4 para evitar problemas de conexión con Supabase en Render
      host: process.env.DB_HOST || 'localhost',
      connectionTimeoutMillis: 10000,
    },

    // Retry de conexión
    retryAttempts: 3,
    retryDelay: 3000,
  };
};
