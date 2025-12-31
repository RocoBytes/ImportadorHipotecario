import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './entities/operation.entity';
import { OperationStaging } from './entities/operation-staging.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Operation, OperationStaging])],
  exports: [TypeOrmModule],
})
export class OperationsModule {}
