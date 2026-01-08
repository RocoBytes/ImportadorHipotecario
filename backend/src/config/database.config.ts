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
      max: 5, // Máximo de conexiones (reducido para pooler)
      min: 1,  // Mínimo de conexiones
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000, // Aumentado para conexiones lentas
      query_timeout: 30000,
      statement_timeout: 30000,
    },

    // Retry de conexión (aumentado para Render cold starts)
    retryAttempts: 5,
    retryDelay: 5000,
    
    // Timeouts adicionales
    connectTimeoutMS: 20000,
    acquireTimeoutMillis: 30000,
  };
};
