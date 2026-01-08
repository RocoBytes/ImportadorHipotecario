import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['log', 'error', 'warn', 'debug'],
  });

  // Helmet - Headers de seguridad
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS - Solo permitir orígenes específicos
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:5174'];

  console.log('🔍 DEBUG CORS:');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('   Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      console.log('   Checking origin:', origin, '| Allowed?', allowedOrigins.includes(origin));
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS bloqueado para origen: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extras
      transform: true, // Transforma tipos automáticamente
    }),
  );

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema Importador Hipotecario')
    .setDescription(
      'API REST para gestión de operaciones hipotecarias en Chile. ' +
      'Incluye autenticación JWT, gestión de usuarios vendedores, ' +
      'importación masiva de operaciones desde CSV, y consultas filtradas por vendedor.'
    )
    .setVersion('1.0')
    .addTag('auth', 'Autenticación y gestión de sesiones')
    .addTag('operations', 'Operaciones hipotecarias')
    .addTag('import', 'Importación de datos desde CSV')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth', // Este es el ID de la autenticación
    )
    .addServer('http://localhost:3000', 'Servidor Local')
    .addServer('https://tu-backend.onrender.com', 'Servidor Producción')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Docs - Importador Hipotecario',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en http://localhost:${port}/api/docs`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 SSL Database: ${process.env.DB_SSL === 'true' ? 'Habilitado' : 'Deshabilitado'}`);
}

bootstrap();
