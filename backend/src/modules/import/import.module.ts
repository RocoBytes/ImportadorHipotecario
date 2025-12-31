import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportLog } from './entities/import-log.entity';
import { Operation } from '../operations/entities/operation.entity';
import { OperationStaging } from '../operations/entities/operation-staging.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImportLog,
      Operation,
      OperationStaging,
      User,
    ]),
    AuthModule, // Para guards JWT
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
