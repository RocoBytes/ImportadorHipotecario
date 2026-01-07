import { ApiProperty } from '@nestjs/swagger';

export class ImportResultDto {
  @ApiProperty({
    description: 'Indica si la importación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Importación completada exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'Número total de filas en el CSV',
    example: 1523,
  })
  filasTotales: number;

  @ApiProperty({
    description: 'Número de filas con estado VIGENTE',
    example: 1450,
  })
  filasVigentes: number;

  @ApiProperty({
    description: 'Número de operaciones insertadas en la base de datos',
    example: 1450,
  })
  filasInsertadas: number;

  @ApiProperty({
    description: 'Número de usuarios vendedores creados automáticamente',
    example: 45,
  })
  usuariosCreados: number;

  @ApiProperty({
    description: 'Lista de errores encontrados durante la importación (opcional)',
    required: false,
    type: [Object],
    example: [],
  })
  errores?: any[];

  @ApiProperty({
    description: 'ID del registro de log de la importación (opcional)',
    required: false,
    example: 'log-2024-01-15-10-30-00',
  })
  logId?: string;
}

