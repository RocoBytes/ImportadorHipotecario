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

    // Pool de conexiones (configuración optimizada para Supabase Pooler)
    extra: {
      max: 3, // Reducido aún más para pooler
      min: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000, // 30 segundos
      query_timeout: 60000, // 60 segundos
      statement_timeout: 60000, // 60 segundos
    },

    // Retry de conexión (aumentado para Render cold starts)
    retryAttempts: 5,
    retryDelay: 5000,
    
    // Timeout adicional
    connectTimeoutMS: 30000, // 30 segundos
  };
};
