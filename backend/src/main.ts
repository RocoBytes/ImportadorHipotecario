import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 SSL Database: ${process.env.DB_SSL === 'true' ? 'Habilitado' : 'Deshabilitado'}`);
}

bootstrap();
