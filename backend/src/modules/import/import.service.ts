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
   * 1. Parse del CSV (importa todos los registros)
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
          'No se encontraron registros válidos en el archivo CSV',
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
   * Paso 1: Parse CSV (importa todos los registros sin filtrar)
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

          console.log(`📊 Total de filas parseadas del CSV: ${totalRows}`);
          
          // Mostrar las primeras columnas para debug
          if (results.data.length > 0) {
            const firstRow = results.data[0];
            console.log('📋 Columnas detectadas:', Object.keys(firstRow).slice(0, 10));
          }

          // Filtrar solo filas que tengan datos válidos (excluir filas completamente vacías)
          const rowsVigentes = results.data.filter((row: any) => {
            // Verificar que la fila tenga al menos el campo "Solicitud" con un valor
            const solicitud = row['Solicitud']?.toString().trim();
            const hasData = solicitud && solicitud.length > 0;
            
            if (!hasData && Object.keys(row).length > 0) {
              // Log solo las primeras filas rechazadas para no saturar
              const rowIndex = results.data.indexOf(row);
              if (rowIndex < 3) {
                console.log(`⚠️ Fila ${rowIndex} rechazada. Solicitud:`, solicitud, 'Keys:', Object.keys(row).slice(0, 5));
              }
            }
            
            return hasData;
          });

          console.log(`✅ Filas válidas después del filtro: ${rowsVigentes.length}`);

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
    // Extraer RUTs únicos de la columna "Rut Vendedor"
    const rutsUnicos = new Set<string>();

    rows.forEach((row) => {
      const rut = row['Rut Vendedor']?.trim();
      if (rut) {
        const normalizedRut = normalizeRut(rut);
        rutsUnicos.add(normalizedRut);
      }
    });

    console.log(`   RUTs únicos encontrados: ${rutsUnicos.size}`);

    // Buscar TODOS los usuarios VENDEDOR (más eficiente que IN con 900+ RUTs)
    const existingUsers = await this.userRepository.find({
      where: { rol: UserRole.VENDEDOR },
    });

    console.log(`   👥 Usuarios VENDEDOR existentes en BD: ${existingUsers.length}`);

    const existingRuts = new Set(existingUsers.map((u) => u.rut));
    const userMap = new Map<string, string>();

    // Mapear usuarios existentes - usar RUT como está en la BD (ya normalizado)
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

      const bcryptRounds = 8; // Reducido a 8 para ser más rápido (aún seguro)
      const BATCH_SIZE = 100; // Aumentado a 100

      for (let i = 0; i < rutsToCreate.length; i += BATCH_SIZE) {
        const batch = rutsToCreate.slice(i, i + BATCH_SIZE);
        console.log(`   📦 Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rutsToCreate.length / BATCH_SIZE)} (${batch.length} usuarios)...`);

        // Hashear passwords en paralelo
        const hashPromises = batch.map(async (rut) => {
          const tempPassword = this.generatePasswordFromRut(rut);
          const tempPasswordHash = await bcrypt.hash(tempPassword, bcryptRounds);
          return { rut, passwordHash: tempPasswordHash };
        });

        try {
          const hashedData = await Promise.all(hashPromises);
          
          const usersToCreate = hashedData.map(({ rut, passwordHash }) =>
            this.userRepository.create({
              rut,
              passwordHash,
              rol: UserRole.VENDEDOR,
              mustChangePassword: true,
            }),
          );

          // Guardar el lote completo
          const savedUsers = await this.userRepository.save(usersToCreate);
          savedUsers.forEach((savedUser) => {
            userMap.set(savedUser.rut, savedUser.id);
            createdCount++;
          });
          
          console.log(`   ✅ Lote guardado: ${savedUsers.length} usuarios`);
        } catch (error) {
          console.error(`   ⚠️ Error en lote, procesando individualmente:`, error.message);
          // Fallback: uno por uno
          for (const rut of batch) {
            try {
              const tempPassword = this.generatePasswordFromRut(rut);
              const tempPasswordHash = await bcrypt.hash(tempPassword, bcryptRounds);
              const newUser = this.userRepository.create({
                rut,
                passwordHash: tempPasswordHash,
                rol: UserRole.VENDEDOR,
                mustChangePassword: true,
              });
              const savedUser = await this.userRepository.save(newUser);
              userMap.set(rut, savedUser.id);
              createdCount++;
            } catch (e) {
              console.error(`   ❌ Error usuario ${rut}:`, e.message);
            }
          }
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
    let skippedRows = 0;
    
    console.log(`   📦 Intentando cargar ${rows.length} filas a staging...`);
    console.log(`   🗺️  UserMap tiene ${userMap.size} usuarios mapeados`);

    for (const row of rows) {
      try {
        const rutVendedor = normalizeRut(row['Rut Vendedor']?.trim() || '');
        const userId = userMap.get(rutVendedor);

        if (!userId) {
          console.warn(`   Usuario no encontrado para RUT: ${rutVendedor}`);
          skippedRows++;
          continue;
        }

        // Mapear todos los campos del CSV
        const stagingRecord = this.stagingRepository.create({
          userId,
          // Campos básicos
          fechaCreacion: this.parseExcelDate(row['Fecha creacion']?.trim()),
          diasTasa: this.parseIntValue(row['Dias tasa']?.trim()),
          tipo: row['Tipo']?.trim() || null,
          solicitud: this.parseIntValue(row['Solicitud']?.trim()),
          estadoSolicitud: row['Estado Solicitud']?.trim() || null,
          fechaResolucion: this.parseExcelDate(row['Fecha resolucion']?.trim()),
          fechaAprobacionManual90: this.parseExcelDate(row['Fecha aprobacion manual (90)']?.trim()),
          fechaEscritura: this.parseExcelDate(row['Fecha de escritura']?.trim()),
          estadoMutuo: row['Estado Mutuo']?.trim() || null,
          mutuo: row['Mutuo']?.trim() || null,

          // Datos del cliente
          rut: normalizeRut(row['Rut']?.trim() || ''),
          nombre: row['Nombre']?.trim() || null,
          apellidoPaterno: row['Apellido Paterno']?.trim() || null,
          apellidoMaterno: row['Apellido Materno']?.trim() || null,

          // Ejecutivos
          ejecutivo: row['Ejecutivo']?.trim() || null,
          ejecutivoOperaciones: row['Ejecutivo Operaciones']?.trim() || null,

          // Tipo de operación
          tipoOperacion: row['Tipo Operacion']?.trim() || null,

          // Montos financieros
          valorVenta: this.parseMoneyValue(row['Valor Venta']?.trim()),
          valorAsegurable: this.parseMoneyValue(row['Valor Asegurable']?.trim()),
          montoPie: this.parseMoneyValue(row['Monto Pie']?.trim()),
          montoSubsidio: this.parseMoneyValue(row['Monto Subsidio']?.trim()),
          creditoTotal: this.parseMoneyValue(row['Credito Total']?.trim()),
          montoHipoteca: this.parseMoneyValue(row['Monto Hipoteca']?.trim()),
          finesGenerales: this.parseMoneyValue(row['Fines Generales']?.trim()),
          gastosOperacionales: this.parseMoneyValue(row['Gastos Operacionales']?.trim()),
          noFinanciado: this.parseMoneyValue(row['No Financiado']?.trim()),
          valorTasacion: this.parseMoneyValue(row['Valor Tasacion']?.trim()),

          // Términos del crédito
          plazo: this.parseIntValue(row['Plazo']?.trim()),
          periodoGracia: this.parseIntValue(row['Periodo Gracia']?.trim()),
          tasaEmision: this.parseMoneyValue(row['Tasa emision']?.trim()),

          // Entidades relacionadas
          bancoAlzante: row['Banco Alzante']?.trim() || null,
          repertorio: row['Repertorio']?.trim() || null,
          notaria: row['Notaria']?.trim() || null,
          agenciaBroker: row['Agencia/Broker']?.trim() || null,
          abogado: row['Abogado']?.trim() || null,

          // Otros campos de documentación
          prontoPago: this.parseBooleanValue(row['Pronto Pago']?.trim()),
          rol: row['Rol']?.trim() || null,
          caratula: row['Caratula']?.trim() || null,
          caratulaEndoso: row['Caratula Endoso']?.trim() || null,
          fechaF24: this.parseExcelDate(row['Fecha F.24']?.trim()),
          inversionista: row['Inversionista']?.trim() || null,
          tasaEndoso: this.parseMoneyValue(row['Tasa Endoso']?.trim()),
          comunaBienRaiz: row['Comuna Bien Raiz']?.trim() || null,
          estadoActual: row['Estado actual']?.trim() || null,

          // Etapas del proceso
          oeVisadoInicio: this.parseExcelDate(row['OE Visado Inicio']?.trim()),
          oeVisadoTermino: this.parseExcelDate(row['OE Visado Termino']?.trim()),
          borradorInicio: this.parseExcelDate(row['Borrador Inicio']?.trim()),
          borradorTermino: this.parseExcelDate(row['Borrador Termino']?.trim()),
          preFirmaInicio: this.parseExcelDate(row['Pre firma Inicio']?.trim()),
          preFirmaTermino: this.parseExcelDate(row['Pre firma Termino']?.trim()),
          firmaClienteInicio: this.parseExcelDate(row['Firma Cliente Inicio']?.trim()),
          firmaClienteTermino: this.parseExcelDate(row['Firma Cliente Termino']?.trim()),
          firmaCodeudoresInicio: this.parseExcelDate(row['Firma Codeudores Inicio']?.trim()),
          firmaCodeudoresTermino: this.parseExcelDate(row['Firma Codeudores Termino']?.trim()),
          firmaMandatarioInicio: this.parseExcelDate(row['Firma Mandatario Inicio']?.trim()),
          firmaMandatarioTermino: this.parseExcelDate(row['Firma Mandatario Termino']?.trim()),
          firmaVendedorInicio: this.parseExcelDate(row['Firma Vendedor Inicio']?.trim()),
          firmaVendedorTermino: this.parseExcelDate(row['Firma Vendedor Termino']?.trim()),
          firmaAlzanteInicio: this.parseExcelDate(row['Firma Alzante Inicio']?.trim()),
          rechazoAlzanteInicio: this.parseExcelDate(row['Rechazo Alzante Inicio']?.trim()),
          rechazoAlzanteTermino: this.parseExcelDate(row['Rechazo Alzante Termino']?.trim()),
          firmaAlzanteTermino: this.parseExcelDate(row['Firma Alzante Termino']?.trim()),
          firmaHipotecariaEvolucionaInicio: this.parseExcelDate(row['Firma Hipotecaria Evoluciona Inicio']?.trim()),
          firmaHipotecariaEvolucionaTermino: this.parseExcelDate(row['Firma Hipotecaria Evoluciona Termino']?.trim()),
          vbAbogadosInicio: this.parseExcelDate(row['VB Abogados Inicio']?.trim()),
          vbAbogadosTermino: this.parseExcelDate(row['VB Abogados Termino']?.trim()),
          cierreCopiasInicio: this.parseExcelDate(row['Cierre copias Inicio']?.trim()),
          cierreCopiasTermino: this.parseExcelDate(row['Cierre copias Termino']?.trim()),
          cbrInicio: this.parseExcelDate(row['CBR Inicio']?.trim()),
          rechazoCbrInicio: this.parseExcelDate(row['Rechazo CBR Inicio']?.trim()),
          rechazoCbrTermino: this.parseExcelDate(row['Rechazo CBR Termino']?.trim()),
          cbrTermino: this.parseExcelDate(row['CBR Termino']?.trim()),
          informeFinalInicio: this.parseExcelDate(row['Informe Final Inicio']?.trim()),
          informeFinalTermino: this.parseExcelDate(row['Informe Final Termino']?.trim()),
          fechaEndoso: this.parseExcelDate(row['Fecha de endoso']?.trim()),
          saldoPendienteDesembolso: this.parseMoneyValue(row['Saldo pendiente desembolso']?.trim()),
          fechaDesembolsoPago: this.parseExcelDate(row['Fecha de Desembolso PAGO']?.trim()),
          fechaPreagoTotal: this.parseExcelDate(row['Fecha Prepago Total']?.trim()),
          endosoCbrInicio: this.parseExcelDate(row['Endoso CBR Inicio']?.trim()),
          endosoCbrTermino: this.parseExcelDate(row['Endoso CBR Termino']?.trim()),
          entregaEscInicio: this.parseExcelDate(row['Entrega Esc. Inicio']?.trim()),
          entregaEscTermino: this.parseExcelDate(row['Entrega Esc. Termino']?.trim()),

          // Datos del vendedor
          rutVendedor: rutVendedor,
          nombreVendedor: row['Nombre Vendedor']?.trim() || null,
        });

        stagingRecords.push(stagingRecord);
      } catch (error) {
        console.error('   Error procesando fila:', error.message);
      }
    }

    console.log(`   ✅ Filas válidas para insertar: ${stagingRecords.length}`);
    console.log(`   ⚠️  Filas saltadas por RUT no encontrado: ${skippedRows}`);

    // Insertar en lotes para mejor performance
    const batchSize = 500;
    for (let i = 0; i < stagingRecords.length; i += batchSize) {
      const batch = stagingRecords.slice(i, i + batchSize);
      await this.stagingRepository.save(batch);
    }
    
    console.log(`   💾 ${stagingRecords.length} filas cargadas en staging`);
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

      // 2. Copiar datos de staging a operations con TODOS los campos
      await queryRunner.query(`
        INSERT INTO operations (
          id, user_id, 
          fecha_creacion, dias_tasa, tipo, solicitud, estado_solicitud, 
          fecha_resolucion, fecha_aprobacion_manual_90, fecha_escritura, 
          estado_mutuo, mutuo, rut, nombre, apellido_paterno, apellido_materno,
          ejecutivo, ejecutivo_operaciones, tipo_operacion,
          valor_venta, valor_asegurable, monto_pie, monto_subsidio, credito_total,
          monto_hipoteca, fines_generales, gastos_operacionales, no_financiado, valor_tasacion,
          plazo, periodo_gracia, tasa_emision,
          banco_alzante, repertorio, notaria, agencia_broker, abogado,
          pronto_pago, rol, caratula, caratula_endoso, fecha_f24, inversionista, tasa_endoso,
          comuna_bien_raiz, estado_actual,
          oe_visado_inicio, oe_visado_termino, borrador_inicio, borrador_termino,
          pre_firma_inicio, pre_firma_termino, firma_cliente_inicio, firma_cliente_termino,
          firma_codeudores_inicio, firma_codeudores_termino, firma_mandatario_inicio, firma_mandatario_termino,
          firma_vendedor_inicio, firma_vendedor_termino, firma_alzante_inicio, rechazo_alzante_inicio,
          rechazo_alzante_termino, firma_alzante_termino, firma_hipotecaria_evoluciona_inicio, 
          firma_hipotecaria_evoluciona_termino, vb_abogados_inicio, vb_abogados_termino,
          cierre_copias_inicio, cierre_copias_termino, cbr_inicio, rechazo_cbr_inicio,
          rechazo_cbr_termino, cbr_termino, informe_final_inicio, informe_final_termino,
          fecha_endoso, saldo_pendiente_desembolso, fecha_desembolso_pago, fecha_prepago_total,
          endoso_cbr_inicio, endoso_cbr_termino, entrega_esc_inicio, entrega_esc_termino,
          rut_vendedor, nombre_vendedor,
          created_at, updated_at
        )
        SELECT 
          id, user_id,
          fecha_creacion, dias_tasa, tipo, solicitud, estado_solicitud,
          fecha_resolucion, fecha_aprobacion_manual_90, fecha_escritura,
          estado_mutuo, mutuo, rut, nombre, apellido_paterno, apellido_materno,
          ejecutivo, ejecutivo_operaciones, tipo_operacion,
          valor_venta, valor_asegurable, monto_pie, monto_subsidio, credito_total,
          monto_hipoteca, fines_generales, gastos_operacionales, no_financiado, valor_tasacion,
          plazo, periodo_gracia, tasa_emision,
          banco_alzante, repertorio, notaria, agencia_broker, abogado,
          pronto_pago, rol, caratula, caratula_endoso, fecha_f24, inversionista, tasa_endoso,
          comuna_bien_raiz, estado_actual,
          oe_visado_inicio, oe_visado_termino, borrador_inicio, borrador_termino,
          pre_firma_inicio, pre_firma_termino, firma_cliente_inicio, firma_cliente_termino,
          firma_codeudores_inicio, firma_codeudores_termino, firma_mandatario_inicio, firma_mandatario_termino,
          firma_vendedor_inicio, firma_vendedor_termino, firma_alzante_inicio, rechazo_alzante_inicio,
          rechazo_alzante_termino, firma_alzante_termino, firma_hipotecaria_evoluciona_inicio,
          firma_hipotecaria_evoluciona_termino, vb_abogados_inicio, vb_abogados_termino,
          cierre_copias_inicio, cierre_copias_termino, cbr_inicio, rechazo_cbr_inicio,
          rechazo_cbr_termino, cbr_termino, informe_final_inicio, informe_final_termino,
          fecha_endoso, saldo_pendiente_desembolso, fecha_desembolso_pago, fecha_prepago_total,
          endoso_cbr_inicio, endoso_cbr_termino, entrega_esc_inicio, entrega_esc_termino,
          rut_vendedor, nombre_vendedor,
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
   * Genera contraseña temporal basada en el RUT
   * Primeros 4 dígitos del RUT + último dígito (verificador)
   * Ejemplo: 76453723-8 → 76458
   */
  private generatePasswordFromRut(rut: string): string {
    // Remover guión y obtener solo los números
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    
    // Si el RUT tiene menos de 5 caracteres, usar como está
    if (cleanRut.length < 5) {
      return cleanRut;
    }
    
    // Primeros 4 dígitos
    const first4 = cleanRut.substring(0, 4);
    // Último dígito (verificador)
    const lastDigit = cleanRut.charAt(cleanRut.length - 1);
    
    return first4 + lastDigit;
  }

  /**
   * Parsea fecha de Excel (número serial o string)
   */
  private parseExcelDate(value: string): Date | null {
    if (!value) return null;

    // Primero verificar si es una fecha en formato DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY o DD-MM-YY
    const parts = value.split(/[/-]/);
    if (parts.length === 3) {
      const [day, month, yearStr] = parts;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      let yearNum = parseInt(yearStr, 10);
      
      if (!isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum)) {
        // Si el año tiene 2 dígitos, convertir a 4 dígitos
        // Años 00-30 se consideran 2000-2030, 31-99 se consideran 1931-1999
        if (yearNum < 100) {
          yearNum = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
        }
        
        return new Date(yearNum, monthNum - 1, dayNum);
      }
    }

    // Si NO tiene separadores, verificar si es un número serial de Excel
    const serialNumber = parseFloat(value);
    if (!isNaN(serialNumber) && !value.includes('-') && !value.includes('/')) {
      // Excel fecha serial: días desde 1900-01-01
      const excelEpoch = new Date(1900, 0, 1);
      const days = serialNumber - 2; // -2 por bug de Excel con años bisiestos
      return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
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
   * Parsea valor entero
   */
  private parseIntValue(value: string): number | null {
    if (!value) return null;
    const number = parseInt(value, 10);
    return isNaN(number) ? null : number;
  }

  /**
   * Parsea valor booleano desde "si"/"no"
   */
  private parseBooleanValue(value: string): boolean | null {
    if (!value) return null;
    const normalized = value.toLowerCase().trim();
    if (normalized === 'si' || normalized === 'sí' || normalized === 'yes') return true;
    if (normalized === 'no') return false;
    return null;
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
