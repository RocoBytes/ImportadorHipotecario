import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as Papa from 'papaparse';
import * as bcrypt from 'bcrypt';
import { Operation } from '../operations/entities/operation.entity';
import { OperationStaging } from '../operations/entities/operation-staging.entity';
import { ImportLog } from './entities/import-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ImportResultDto } from './dto/import-result.dto';
import { normalizeRut } from '../../common/utils/rut.utils';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(OperationStaging)
    private readonly stagingRepository: Repository<OperationStaging>,
    @InjectRepository(ImportLog)
    private readonly importLogRepository: Repository<ImportLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Procesa un archivo CSV con el algoritmo completo:
   * 1. Parse y filtrado (Estado Mutuo == 'Vigente')
   * 2. Sincronización de usuarios
   * 3. Carga a staging
   * 4. Swap transaccional
   * 5. Log de importación
   */
  async processFile(
    file: Express.Multer.File,
    adminId: string,
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const errores: any[] = [];
    let filasTotales = 0;
    let filasVigentes = 0;
    let usuariosCreados = 0;

    try {
      // 1. PARSING & FILTRADO
      console.log('📄 Paso 1: Parsing del CSV...');
      const { rowsVigentes, totalRows } = await this.parseAndFilterCSV(file);
      filasTotales = totalRows;
      filasVigentes = rowsVigentes.length;

      console.log(`   Total filas: ${filasTotales}`);
      console.log(`   Filas vigentes: ${filasVigentes}`);

      if (filasVigentes === 0) {
        throw new BadRequestException(
          'No se encontraron registros con Estado Mutuo "Vigente"',
        );
      }

      // 2. SYNC USUARIOS
      console.log('👥 Paso 2: Sincronización de usuarios...');
      const { userMap, createdCount } = await this.syncUsers(rowsVigentes);
      usuariosCreados = createdCount;
      console.log(`   Usuarios creados: ${usuariosCreados}`);

      // 3. CARGA A STAGING
      console.log('📦 Paso 3: Cargando datos a staging...');
      await this.loadToStaging(rowsVigentes, userMap);
      console.log(`   ${filasVigentes} filas cargadas en staging`);

      // 4. TRANSACCIÓN (SWAP)
      console.log('🔄 Paso 4: Swap transaccional...');
      await this.swapTables();
      console.log('   Swap completado exitosamente');

      // 5. GUARDAR LOG
      console.log('📝 Paso 5: Guardando log...');
      const log = await this.saveImportLog({
        adminId,
        filasTotales,
        filasInsertadas: filasVigentes,
        errores: errores.length > 0 ? errores : null,
        archivoNombre: file.originalname,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Importación completada en ${duration}s`);

      return {
        success: true,
        message: 'Importación completada exitosamente',
        filasTotales,
        filasVigentes,
        filasInsertadas: filasVigentes,
        usuariosCreados,
        logId: log.id,
      };
    } catch (error) {
      console.error('❌ Error en importación:', error.message);

      // Guardar log de error
      await this.saveImportLog({
        adminId,
        filasTotales,
        filasInsertadas: 0,
        errores: [{ message: error.message, stack: error.stack }],
        archivoNombre: file.originalname,
      });

      throw error;
    }
  }

  /**
   * Paso 1: Parse CSV y filtra por Estado Mutuo == 'Vigente'
   */
  private async parseAndFilterCSV(
    file: Express.Multer.File,
  ): Promise<{ rowsVigentes: any[]; totalRows: number }> {
    return new Promise((resolve, reject) => {
      const fileContent = file.buffer.toString('utf-8');

      Papa.parse(fileContent, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        dynamicTyping: false, // Mantener como strings para procesamiento manual
        complete: (results) => {
          const totalRows = results.data.length;

          // Filtrar solo registros vigentes
          const rowsVigentes = results.data.filter((row: any) => {
            const estadoMutuo = row['Estado Mutuo']?.trim() || '';
            return (
              estadoMutuo.toLowerCase() === 'vigente' ||
              estadoMutuo.toLowerCase() === 'vigentes'
            );
          });

          resolve({ rowsVigentes, totalRows });
        },
        error: (error) => {
          reject(
            new BadRequestException(
              `Error al parsear CSV: ${error.message}`,
            ),
          );
        },
      });
    });
  }

  /**
   * Paso 2: Sincroniza usuarios
   * - Extrae RUTs únicos
   * - Crea usuarios que no existen con rol VENDEDOR
   * - Retorna mapa RUT -> UserID
   */
  private async syncUsers(
    rows: any[],
  ): Promise<{ userMap: Map<string, string>; createdCount: number }> {
    // Extraer RUTs únicos de la columna "RUT Ejecutivo"
    const rutsUnicos = new Set<string>();

    rows.forEach((row) => {
      const rut = row['RUT Ejecutivo']?.trim();
      if (rut) {
        const normalizedRut = normalizeRut(rut);
        rutsUnicos.add(normalizedRut);
      }
    });

    console.log(`   RUTs únicos encontrados: ${rutsUnicos.size}`);

    // Buscar usuarios existentes
    const existingUsers = await this.userRepository.find({
      where: rutsUnicos.size > 0 ? { rut: Array.from(rutsUnicos) as any } : {},
    });

    const existingRuts = new Set(existingUsers.map((u) => u.rut));
    const userMap = new Map<string, string>();

    // Mapear usuarios existentes
    existingUsers.forEach((user) => {
      userMap.set(user.rut, user.id);
    });

    // Crear usuarios nuevos
    const rutsToCreate = Array.from(rutsUnicos).filter(
      (rut) => !existingRuts.has(rut),
    );

    let createdCount = 0;

    if (rutsToCreate.length > 0) {
      console.log(`   Creando ${rutsToCreate.length} usuarios nuevos...`);

      // Generar password temporal (mismo hash para todos)
      const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      const tempPasswordHash = await bcrypt.hash('temporal123', bcryptRounds);

      for (const rut of rutsToCreate) {
        try {
          const newUser = this.userRepository.create({
            rut,
            passwordHash: tempPasswordHash,
            rol: UserRole.VENDEDOR,
            mustChangePassword: true,
          });

          const savedUser = await this.userRepository.save(newUser);
          userMap.set(rut, savedUser.id);
          createdCount++;
        } catch (error) {
          console.error(`   Error creando usuario ${rut}:`, error.message);
        }
      }
    }

    return { userMap, createdCount };
  }

  /**
   * Paso 3: Carga datos a operations_staging
   */
  private async loadToStaging(
    rows: any[],
    userMap: Map<string, string>,
  ): Promise<void> {
    // Limpiar staging antes de cargar
    await this.stagingRepository.clear();

    const stagingRecords = [];

    for (const row of rows) {
      try {
        const rutEjecutivo = normalizeRut(row['RUT Ejecutivo']?.trim() || '');
        const userId = userMap.get(rutEjecutivo);

        if (!userId) {
          console.warn(`   Usuario no encontrado para RUT: ${rutEjecutivo}`);
          continue;
        }

        // Transformar fecha Excel a Date
        const fechaEscritura = this.parseExcelDate(
          row['Fecha Escritura']?.trim(),
        );

        // Transformar monto (coma a punto)
        const valorVenta = this.parseMoneyValue(row['Valor Venta']?.trim());

        // Normalizar RUT cliente
        const rutCliente = normalizeRut(row['RUT Cliente']?.trim() || '');

        // Extraer campos principales
        const idMutuo = row['ID Mutuo']?.trim() || null;
        const estadoMutuo = row['Estado Mutuo']?.trim() || null;
        const nombreCliente = row['Nombre Cliente']?.trim() || null;

        // Guardar columnas adicionales en detallesExtra
        const detallesExtra: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          if (
            ![
              'ID Mutuo',
              'Estado Mutuo',
              'Fecha Escritura',
              'Valor Venta',
              'RUT Cliente',
              'Nombre Cliente',
              'RUT Ejecutivo',
            ].includes(key)
          ) {
            detallesExtra[key] = row[key];
          }
        });

        const stagingRecord = this.stagingRepository.create({
          userId,
          idMutuo,
          estadoMutuo,
          fechaEscritura,
          valorVenta,
          rutCliente,
          nombreCliente,
          detallesExtra: Object.keys(detallesExtra).length > 0 ? detallesExtra : null,
        });

        stagingRecords.push(stagingRecord);
      } catch (error) {
        console.error('   Error procesando fila:', error.message);
      }
    }

    // Insertar en lotes para mejor performance
    const batchSize = 500;
    for (let i = 0; i < stagingRecords.length; i += batchSize) {
      const batch = stagingRecords.slice(i, i + batchSize);
      await this.stagingRepository.save(batch);
    }
  }

  /**
   * Paso 4: Swap transaccional (Staging -> Production)
   */
  private async swapTables(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Truncar tabla operations (eliminar datos antiguos)
      await queryRunner.query('TRUNCATE TABLE operations CASCADE');

      // 2. Copiar datos de staging a operations
      await queryRunner.query(`
        INSERT INTO operations (
          id, user_id, id_mutuo, estado_mutuo, fecha_escritura,
          valor_venta, rut_cliente, nombre_cliente, detalles_extra,
          created_at, updated_at
        )
        SELECT 
          id, user_id, id_mutuo, estado_mutuo, fecha_escritura,
          valor_venta, rut_cliente, nombre_cliente, detalles_extra,
          created_at, updated_at
        FROM operations_staging
      `);

      // 3. Limpiar staging
      await queryRunner.query('TRUNCATE TABLE operations_staging CASCADE');

      // Commit
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Error en swap transaccional: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Paso 5: Guarda log de importación
   */
  private async saveImportLog(data: {
    adminId: string;
    filasTotales: number;
    filasInsertadas: number;
    errores: any;
    archivoNombre: string;
  }): Promise<ImportLog> {
    const log = this.importLogRepository.create(data);
    return await this.importLogRepository.save(log);
  }

  /**
   * Parsea fecha de Excel (número serial o string)
   */
  private parseExcelDate(value: string): Date | null {
    if (!value) return null;

    // Si es un número (serial de Excel)
    const serialNumber = parseFloat(value);
    if (!isNaN(serialNumber)) {
      // Excel fecha serial: días desde 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const days = serialNumber - 2; // -2 por bug de Excel con años bisiestos
      return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    }

    // Si es una fecha en formato DD/MM/YYYY o DD-MM-YYYY
    const parts = value.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts.map((p) => parseInt(p, 10));
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }

    // Intentar parseo nativo
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Parsea valor monetario (convierte coma a punto)
   */
  private parseMoneyValue(value: string): number | null {
    if (!value) return null;

    // Remover puntos de miles y reemplazar coma por punto
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const number = parseFloat(cleaned);

    return isNaN(number) ? null : number;
  }

  /**
   * Obtiene historial de importaciones
   */
  async getImportLogs(adminId?: string): Promise<ImportLog[]> {
    const where = adminId ? { adminId } : {};
    return await this.importLogRepository.find({
      where,
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
