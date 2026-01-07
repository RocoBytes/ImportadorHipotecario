import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ImportResultDto } from './dto/import-result.dto';

@ApiTags('import')
@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * POST /api/import/upload
   * Procesa archivo CSV de mutuos
   * Solo accesible por ADMIN
   */
  @Post('upload')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return callback(
            new BadRequestException('Solo se permiten archivos CSV'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ 
    summary: 'Importar CSV de operaciones',
    description: 'Procesa un archivo CSV con operaciones hipotecarias. Crea usuarios vendedores automáticamente y asocia las operaciones. Solo accesible para usuarios ADMIN. Tamaño máximo: 10MB.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo CSV con operaciones hipotecarias',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo CSV con formato específico (delimitador: punto y coma)',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Importación exitosa',
    type: ImportResultDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Archivo inválido o formato incorrecto' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'No autorizado (solo ADMIN)' 
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    console.log(`📤 Iniciando importación por admin: ${user.rut}`);
    console.log(`   Archivo: ${file.originalname}`);
    console.log(`   Tamaño: ${(file.size / 1024).toFixed(2)} KB`);

    return await this.importService.processFile(file, user.id);
  }

  /**
   * GET /api/import/logs
   * Obtiene historial de importaciones
   * Solo accesible por ADMIN
   */
  @Get('logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Obtener historial de importaciones',
    description: 'Devuelve el registro completo de todas las importaciones realizadas. Solo accesible para ADMIN.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de importaciones',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          fecha: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
          usuario: { type: 'string', example: 'admin@empresa.cl' },
          operacionesImportadas: { type: 'number', example: 1523 },
          usuariosCreados: { type: 'number', example: 45 },
          estado: { type: 'string', enum: ['exitoso', 'fallido'], example: 'exitoso' },
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'No autorizado (solo ADMIN)' 
  })
  async getImportLogs(@GetUser() user: User) {
    // Admins pueden ver todos los logs
    return await this.importService.getImportLogs();
  }

  /**
   * GET /api/import/my-logs
   * Obtiene historial de importaciones del usuario actual
   * Solo accesible por ADMIN
   */
  @Get('my-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Obtener mis importaciones',
    description: 'Devuelve el registro de importaciones realizadas por el usuario actual. Solo accesible para ADMIN.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de mis importaciones',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          fecha: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
          operacionesImportadas: { type: 'number', example: 1523 },
          usuariosCreados: { type: 'number', example: 45 },
          estado: { type: 'string', enum: ['exitoso', 'fallido'], example: 'exitoso' },
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autenticado' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'No autorizado (solo ADMIN)' 
  })
  async getMyImportLogs(@GetUser() user: User) {
    return await this.importService.getImportLogs(user.id);
  }
}
