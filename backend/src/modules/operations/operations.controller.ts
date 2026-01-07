import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperationsService } from './operations.service';

@ApiTags('operations')
@Controller('operations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  /**
   * Obtiene todas las operaciones del vendedor autenticado
   */
  @Get('me')
  @ApiOperation({ 
    summary: 'Obtener mis operaciones',
    description: 'Devuelve todas las operaciones hipotecarias asociadas al vendedor autenticado. Incluye información completa del cliente, montos, fechas del proceso y estado actual.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de operaciones obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid' },
          solicitud: { type: 'number', example: 4 },
          tipo: { type: 'string', example: 'H' },
          estadoMutuo: { type: 'string', example: 'Vigente' },
          mutuo: { type: 'string', example: 'H-123456' },
          rut: { type: 'string', example: '12345678-9' },
          nombre: { type: 'string', example: 'Juan' },
          apellidoPaterno: { type: 'string', example: 'Pérez' },
          apellidoMaterno: { type: 'string', example: 'González' },
          valorVenta: { type: 'number', example: 50000000 },
          creditoTotal: { type: 'number', example: 40000000 },
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autenticado' 
  })
  async getMyOperations(@Request() req) {
    const userId = req.user.id;
    console.log('🔍 DEBUG: Usuario autenticado:', req.user);
    console.log('🔍 DEBUG: Buscando operaciones para userId:', userId);
    const operations = await this.operationsService.findByUserId(userId);
    console.log('🔍 DEBUG: Operaciones encontradas:', operations.length);
    return operations;
  }
}
