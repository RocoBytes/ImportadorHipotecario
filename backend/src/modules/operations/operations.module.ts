import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entities/operation.entity';
import { OperationStaging } from './entities/operation-staging.entity';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Operation, OperationStaging])],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [TypeOrmModule, OperationsService],
})
export class OperationsModule {}
