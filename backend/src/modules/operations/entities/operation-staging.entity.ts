import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('operations_staging')
export class OperationStaging {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  // Campos básicos de identificación
  @Column({ name: 'fecha_creacion', type: 'date', nullable: true })
  fechaCreacion: Date;

  @Column({ name: 'dias_tasa', type: 'integer', nullable: true })
  diasTasa: number;

  @Column({ name: 'tipo', nullable: true })
  tipo: string;

  @Column({ name: 'solicitud', type: 'integer', nullable: true })
  solicitud: number;

  @Column({ name: 'estado_solicitud', nullable: true })
  estadoSolicitud: string;

  @Column({ name: 'fecha_resolucion', type: 'date', nullable: true })
  fechaResolucion: Date;

  @Column({ name: 'fecha_aprobacion_manual_90', type: 'date', nullable: true })
  fechaAprobacionManual90: Date;

  @Column({ name: 'fecha_escritura', type: 'date', nullable: true })
  fechaEscritura: Date;

  @Column({ name: 'estado_mutuo', nullable: true })
  estadoMutuo: string;

  @Column({ name: 'mutuo', nullable: true })
  mutuo: string;

  // Datos del cliente
  @Column({ name: 'rut', nullable: true })
  rut: string;

  @Column({ name: 'nombre', nullable: true })
  nombre: string;

  @Column({ name: 'apellido_paterno', nullable: true })
  apellidoPaterno: string;

  @Column({ name: 'apellido_materno', nullable: true })
  apellidoMaterno: string;

  // Ejecutivos
  @Column({ name: 'ejecutivo', nullable: true })
  ejecutivo: string;

  @Column({ name: 'ejecutivo_operaciones', nullable: true })
  ejecutivoOperaciones: string;

  // Tipo de operación
  @Column({ name: 'tipo_operacion', nullable: true })
  tipoOperacion: string;

  // Montos financieros (NUMERIC 18,4)
  @Column({ name: 'valor_venta', type: 'numeric', precision: 18, scale: 4, nullable: true })
  valorVenta: number;

  @Column({ name: 'valor_asegurable', type: 'numeric', precision: 18, scale: 4, nullable: true })
  valorAsegurable: number;

  @Column({ name: 'monto_pie', type: 'numeric', precision: 18, scale: 4, nullable: true })
  montoPie: number;

  @Column({ name: 'monto_subsidio', type: 'numeric', precision: 18, scale: 4, nullable: true })
  montoSubsidio: number;

  @Column({ name: 'credito_total', type: 'numeric', precision: 18, scale: 4, nullable: true })
  creditoTotal: number;

  @Column({ name: 'monto_hipoteca', type: 'numeric', precision: 18, scale: 4, nullable: true })
  montoHipoteca: number;

  @Column({ name: 'fines_generales', type: 'numeric', precision: 18, scale: 4, nullable: true })
  finesGenerales: number;

  @Column({ name: 'gastos_operacionales', type: 'numeric', precision: 18, scale: 4, nullable: true })
  gastosOperacionales: number;

  @Column({ name: 'no_financiado', type: 'numeric', precision: 18, scale: 4, nullable: true })
  noFinanciado: number;

  @Column({ name: 'valor_tasacion', type: 'numeric', precision: 18, scale: 4, nullable: true })
  valorTasacion: number;

  // Términos del crédito
  @Column({ name: 'plazo', type: 'integer', nullable: true })
  plazo: number;

  @Column({ name: 'periodo_gracia', type: 'integer', nullable: true })
  periodoGracia: number;

  @Column({ name: 'tasa_emision', type: 'numeric', precision: 9, scale: 4, nullable: true })
  tasaEmision: number;

  // Entidades relacionadas
  @Column({ name: 'banco_alzante', nullable: true })
  bancoAlzante: string;

  @Column({ name: 'repertorio', nullable: true })
  repertorio: string;

  @Column({ name: 'notaria', nullable: true })
  notaria: string;

  @Column({ name: 'agencia_broker', nullable: true })
  agenciaBroker: string;

  @Column({ name: 'abogado', nullable: true })
  abogado: string;

  // Otros campos de documentación
  @Column({ name: 'pronto_pago', type: 'boolean', nullable: true })
  prontoPago: boolean;

  @Column({ name: 'rol', nullable: true })
  rol: string;

  @Column({ name: 'caratula', nullable: true })
  caratula: string;

  @Column({ name: 'caratula_endoso', nullable: true })
  caratulaEndoso: string;

  @Column({ name: 'fecha_f24', type: 'date', nullable: true })
  fechaF24: Date;

  @Column({ name: 'inversionista', nullable: true })
  inversionista: string;

  @Column({ name: 'tasa_endoso', type: 'numeric', precision: 9, scale: 4, nullable: true })
  tasaEndoso: number;

  @Column({ name: 'comuna_bien_raiz', nullable: true })
  comunaBienRaiz: string;

  @Column({ name: 'estado_actual', nullable: true })
  estadoActual: string;

  // Etapas del proceso - OE Visado
  @Column({ name: 'oe_visado_inicio', type: 'date', nullable: true })
  oeVisadoInicio: Date;

  @Column({ name: 'oe_visado_termino', type: 'date', nullable: true })
  oeVisadoTermino: Date;

  // Borrador
  @Column({ name: 'borrador_inicio', type: 'date', nullable: true })
  borradorInicio: Date;

  @Column({ name: 'borrador_termino', type: 'date', nullable: true })
  borradorTermino: Date;

  // Pre firma
  @Column({ name: 'pre_firma_inicio', type: 'date', nullable: true })
  preFirmaInicio: Date;

  @Column({ name: 'pre_firma_termino', type: 'date', nullable: true })
  preFirmaTermino: Date;

  // Firma Cliente
  @Column({ name: 'firma_cliente_inicio', type: 'date', nullable: true })
  firmaClienteInicio: Date;

  @Column({ name: 'firma_cliente_termino', type: 'date', nullable: true })
  firmaClienteTermino: Date;

  // Firma Codeudores
  @Column({ name: 'firma_codeudores_inicio', type: 'date', nullable: true })
  firmaCodeudoresInicio: Date;

  @Column({ name: 'firma_codeudores_termino', type: 'date', nullable: true })
  firmaCodeudoresTermino: Date;

  // Firma Mandatario
  @Column({ name: 'firma_mandatario_inicio', type: 'date', nullable: true })
  firmaMandatarioInicio: Date;

  @Column({ name: 'firma_mandatario_termino', type: 'date', nullable: true })
  firmaMandatarioTermino: Date;

  // Firma Vendedor
  @Column({ name: 'firma_vendedor_inicio', type: 'date', nullable: true })
  firmaVendedorInicio: Date;

  @Column({ name: 'firma_vendedor_termino', type: 'date', nullable: true })
  firmaVendedorTermino: Date;

  // Firma Alzante
  @Column({ name: 'firma_alzante_inicio', type: 'date', nullable: true })
  firmaAlzanteInicio: Date;

  @Column({ name: 'rechazo_alzante_inicio', type: 'date', nullable: true })
  rechazoAlzanteInicio: Date;

  @Column({ name: 'rechazo_alzante_termino', type: 'date', nullable: true })
  rechazoAlzanteTermino: Date;

  @Column({ name: 'firma_alzante_termino', type: 'date', nullable: true })
  firmaAlzanteTermino: Date;

  // Firma Hipotecaria Evoluciona
  @Column({ name: 'firma_hipotecaria_evoluciona_inicio', type: 'date', nullable: true })
  firmaHipotecariaEvolucionaInicio: Date;

  @Column({ name: 'firma_hipotecaria_evoluciona_termino', type: 'date', nullable: true })
  firmaHipotecariaEvolucionaTermino: Date;

  // VB Abogados
  @Column({ name: 'vb_abogados_inicio', type: 'date', nullable: true })
  vbAbogadosInicio: Date;

  @Column({ name: 'vb_abogados_termino', type: 'date', nullable: true })
  vbAbogadosTermino: Date;

  // Cierre copias
  @Column({ name: 'cierre_copias_inicio', type: 'date', nullable: true })
  cierreCopiasInicio: Date;

  @Column({ name: 'cierre_copias_termino', type: 'date', nullable: true })
  cierreCopiasTermino: Date;

  // CBR
  @Column({ name: 'cbr_inicio', type: 'date', nullable: true })
  cbrInicio: Date;

  @Column({ name: 'rechazo_cbr_inicio', type: 'date', nullable: true })
  rechazoCbrInicio: Date;

  @Column({ name: 'rechazo_cbr_termino', type: 'date', nullable: true })
  rechazoCbrTermino: Date;

  @Column({ name: 'cbr_termino', type: 'date', nullable: true })
  cbrTermino: Date;

  // Informe Final
  @Column({ name: 'informe_final_inicio', type: 'date', nullable: true })
  informeFinalInicio: Date;

  @Column({ name: 'informe_final_termino', type: 'date', nullable: true })
  informeFinalTermino: Date;

  // Endoso
  @Column({ name: 'fecha_endoso', type: 'date', nullable: true })
  fechaEndoso: Date;

  // Desembolso
  @Column({ name: 'saldo_pendiente_desembolso', type: 'numeric', precision: 18, scale: 4, nullable: true })
  saldoPendienteDesembolso: number;

  @Column({ name: 'fecha_desembolso_pago', type: 'date', nullable: true })
  fechaDesembolsoPago: Date;

  @Column({ name: 'fecha_prepago_total', type: 'date', nullable: true })
  fechaPreagoTotal: Date;

  // Endoso CBR
  @Column({ name: 'endoso_cbr_inicio', type: 'date', nullable: true })
  endosoCbrInicio: Date;

  @Column({ name: 'endoso_cbr_termino', type: 'date', nullable: true })
  endosoCbrTermino: Date;

  // Entrega Escritura
  @Column({ name: 'entrega_esc_inicio', type: 'date', nullable: true })
  entregaEscInicio: Date;

  @Column({ name: 'entrega_esc_termino', type: 'date', nullable: true })
  entregaEscTermino: Date;

  // Datos del vendedor
  @Column({ name: 'rut_vendedor', nullable: true })
  rutVendedor: string;

  @Column({ name: 'nombre_vendedor', nullable: true })
  nombreVendedor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
