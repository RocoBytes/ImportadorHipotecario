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
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ImportResultDto } from './dto/import-result.dto';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  async getMyImportLogs(@GetUser() user: User) {
    return await this.importService.getImportLogs(user.id);
  }
}
