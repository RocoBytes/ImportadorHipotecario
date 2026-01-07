import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from './entities/operation.entity';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  /**
   * Obtiene todas las operaciones de un usuario específico
   */
  async findByUserId(userId: string): Promise<Operation[]> {
    console.log('🔍 SERVICE DEBUG: Buscando operaciones para userId:', userId);
    console.log('🔍 SERVICE DEBUG: Tipo de userId:', typeof userId);
    
    const operations = await this.operationRepository.find({
      where: { userId },
      order: { fechaEscritura: 'DESC' },
    });
    
    console.log('🔍 SERVICE DEBUG: Total operaciones encontradas:', operations.length);
    if (operations.length > 0) {
      console.log('🔍 SERVICE DEBUG: Primera operación userId:', operations[0].userId);
      console.log('🔍 SERVICE DEBUG: Primera operación solicitud:', operations[0].solicitud);
    }
    
    return operations;
  }

  /**
   * Obtiene el total de registros de un usuario
   */
  async countByUserId(userId: string): Promise<number> {
    return this.operationRepository.count({
      where: { userId },
    });
  }
}
