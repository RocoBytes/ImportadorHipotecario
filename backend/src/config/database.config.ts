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

    // Pool de conexiones (optimizado para Session pooler - más estable)
    extra: {
      max: 5, // Session pooler permite más conexiones
      min: 1,
      idleTimeoutMillis: 120000, // 2 minutos
      connectionTimeoutMillis: 60000, // 60 segundos
      query_timeout: 120000, // 2 minutos (queries lentas en cold start)
      statement_timeout: 120000, // 2 minutos
      keepAlive: true, // Mantener conexión viva
      keepAliveInitialDelayMillis: 10000,
    },

    // Retry de conexión (aumentado para Render cold starts + Supabase wake)
    retryAttempts: 10, // Más reintentos para wake-up
    retryDelay: 3000, // Esperar menos entre reintentos
    
    // Timeout adicional
    connectTimeoutMS: 60000, // 60 segundos
  };
};
