import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OperationsModule } from './modules/operations/operations.module';
import { ImportModule } from './modules/import/import.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigService esté disponible globalmente
      envFilePath: '.env',
    }),

    // Configuración de TypeORM con SSL condicional
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),

    // Módulos de dominio
    UsersModule,
    AuthModule,
    OperationsModule,
    ImportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
