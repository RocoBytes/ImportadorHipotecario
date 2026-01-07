import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperationsService } from './operations.service';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  /**
   * Obtiene todas las operaciones del vendedor autenticado
   */
  @Get('me')
  async getMyOperations(@Request() req) {
    const userId = req.user.id; // req.user es el objeto User completo de JwtStrategy
    console.log('🔍 DEBUG: Usuario autenticado:', req.user);
    console.log('🔍 DEBUG: Buscando operaciones para userId:', userId);
    const operations = await this.operationsService.findByUserId(userId);
    console.log('🔍 DEBUG: Operaciones encontradas:', operations.length);
    return operations;
  }
}
