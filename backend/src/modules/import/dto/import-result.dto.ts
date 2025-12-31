export class ImportResultDto {
  success: boolean;
  message: string;
  filasTotales: number;
  filasVigentes: number;
  filasInsertadas: number;
  usuariosCreados: number;
  errores?: any[];
  logId?: string;
}
