-- =====================================================
-- SCHEMA COMPLETO - IMPORTADOR HIPOTECARIO
-- =====================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Eliminar tablas si existen
DROP TABLE IF EXISTS import_logs CASCADE;
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS operations_staging CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- TIPO ENUM: user_role
-- =====================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'VENDEDOR');

-- =====================================================
-- TABLA: users
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(12) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN DEFAULT TRUE,
    rol user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_rut ON users(rut);

COMMENT ON TABLE users IS 'Usuarios del sistema (ADMIN y VENDEDOR)';
COMMENT ON COLUMN users.rut IS 'RUT normalizado sin puntos, con guión (ej: 12345678-9)';
COMMENT ON COLUMN users.must_change_password IS 'Flag que obliga al usuario a cambiar su contraseña temporal';

-- =====================================================
-- TABLA: operations (Tabla final)
-- =====================================================

CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Campos básicos de identificación
    fecha_creacion DATE,
    dias_tasa INTEGER,
    tipo TEXT,
    solicitud INTEGER,
    estado_solicitud TEXT,
    fecha_resolucion DATE,
    fecha_aprobacion_manual_90 DATE,
    fecha_escritura DATE,
    estado_mutuo TEXT,
    mutuo TEXT,
    
    -- Datos del cliente
    rut TEXT,
    nombre TEXT,
    apellido_paterno TEXT,
    apellido_materno TEXT,
    
    -- Ejecutivos y operación
    ejecutivo TEXT,
    ejecutivo_operaciones TEXT,
    tipo_operacion TEXT,
    
    -- Valores financieros
    valor_venta NUMERIC(18,4),
    valor_asegurable NUMERIC(18,4),
    monto_pie NUMERIC(18,4),
    monto_subsidio NUMERIC(18,4),
    credito_total NUMERIC(18,4),
    monto_hipoteca NUMERIC(18,4),
    fines_generales NUMERIC(18,4),
    gastos_operacionales NUMERIC(18,4),
    no_financiado NUMERIC(18,4),
    valor_tasacion NUMERIC(18,4),
    
    -- Condiciones del crédito
    plazo INTEGER,
    periodo_gracia INTEGER,
    tasa_emision NUMERIC(9,4),
    
    -- Entidades relacionadas
    banco_alzante TEXT,
    repertorio TEXT,
    notaria TEXT,
    agencia_broker TEXT,
    abogado TEXT,
    pronto_pago BOOLEAN,
    
    -- Documentación
    rol TEXT,
    caratula TEXT,
    caratula_endoso TEXT,
    fecha_f24 DATE,
    
    -- Endoso
    inversionista TEXT,
    tasa_endoso NUMERIC(9,4),
    
    -- Ubicación
    comuna_bien_raiz TEXT,
    estado_actual TEXT,
    
    -- Fechas de proceso - OE Visado
    oe_visado_inicio DATE,
    oe_visado_termino DATE,
    
    -- Fechas de proceso - Borrador
    borrador_inicio DATE,
    borrador_termino DATE,
    
    -- Fechas de proceso - Pre firma
    pre_firma_inicio DATE,
    pre_firma_termino DATE,
    
    -- Fechas de proceso - Firma Cliente
    firma_cliente_inicio DATE,
    firma_cliente_termino DATE,
    
    -- Fechas de proceso - Firma Codeudores
    firma_codeudores_inicio DATE,
    firma_codeudores_termino DATE,
    
    -- Fechas de proceso - Firma Mandatario
    firma_mandatario_inicio DATE,
    firma_mandatario_termino DATE,
    
    -- Fechas de proceso - Firma Vendedor
    firma_vendedor_inicio DATE,
    firma_vendedor_termino DATE,
    
    -- Fechas de proceso - Firma Alzante
    firma_alzante_inicio DATE,
    rechazo_alzante_inicio DATE,
    rechazo_alzante_termino DATE,
    firma_alzante_termino DATE,
    
    -- Fechas de proceso - Firma Hipotecaria Evoluciona
    firma_hipotecaria_evoluciona_inicio DATE,
    firma_hipotecaria_evoluciona_termino DATE,
    
    -- Fechas de proceso - VB Abogados
    vb_abogados_inicio DATE,
    vb_abogados_termino DATE,
    
    -- Fechas de proceso - Cierre copias
    cierre_copias_inicio DATE,
    cierre_copias_termino DATE,
    
    -- Fechas de proceso - CBR
    cbr_inicio DATE,
    rechazo_cbr_inicio DATE,
    rechazo_cbr_termino DATE,
    cbr_termino DATE,
    
    -- Fechas de proceso - Informe Final
    informe_final_inicio DATE,
    informe_final_termino DATE,
    
    -- Fechas de endoso y desembolso
    fecha_endoso DATE,
    saldo_pendiente_desembolso NUMERIC(18,4),
    fecha_desembolso_pago DATE,
    fecha_prepago_total DATE,
    
    -- Fechas de proceso - Endoso CBR
    endoso_cbr_inicio DATE,
    endoso_cbr_termino DATE,
    
    -- Fechas de proceso - Entrega Escritura
    entrega_esc_inicio DATE,
    entrega_esc_termino DATE,
    
    -- Datos del vendedor
    rut_vendedor TEXT,
    nombre_vendedor TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Llave foránea
    CONSTRAINT fk_operations_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Índices para optimización
CREATE INDEX idx_operations_user_id ON operations(user_id);
CREATE INDEX idx_operations_estado_mutuo ON operations(estado_mutuo);
CREATE INDEX idx_operations_mutuo ON operations(mutuo);
CREATE INDEX idx_operations_fecha_escritura ON operations(fecha_escritura);
CREATE INDEX idx_operations_rut_vendedor ON operations(rut_vendedor);
CREATE INDEX idx_operations_solicitud ON operations(solicitud);

COMMENT ON TABLE operations IS 'Tabla final de operaciones hipotecarias con todos los campos del proceso';

-- =====================================================
-- TABLA: operations_staging (Mesa de trabajo)
-- =====================================================

CREATE TABLE operations_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    -- Campos básicos de identificación
    fecha_creacion DATE,
    dias_tasa INTEGER,
    tipo TEXT,
    solicitud INTEGER,
    estado_solicitud TEXT,
    fecha_resolucion DATE,
    fecha_aprobacion_manual_90 DATE,
    fecha_escritura DATE,
    estado_mutuo TEXT,
    mutuo TEXT,
    
    -- Datos del cliente
    rut TEXT,
    nombre TEXT,
    apellido_paterno TEXT,
    apellido_materno TEXT,
    
    -- Ejecutivos y operación
    ejecutivo TEXT,
    ejecutivo_operaciones TEXT,
    tipo_operacion TEXT,
    
    -- Valores financieros
    valor_venta NUMERIC(18,4),
    valor_asegurable NUMERIC(18,4),
    monto_pie NUMERIC(18,4),
    monto_subsidio NUMERIC(18,4),
    credito_total NUMERIC(18,4),
    monto_hipoteca NUMERIC(18,4),
    fines_generales NUMERIC(18,4),
    gastos_operacionales NUMERIC(18,4),
    no_financiado NUMERIC(18,4),
    valor_tasacion NUMERIC(18,4),
    
    -- Condiciones del crédito
    plazo INTEGER,
    periodo_gracia INTEGER,
    tasa_emision NUMERIC(9,4),
    
    -- Entidades relacionadas
    banco_alzante TEXT,
    repertorio TEXT,
    notaria TEXT,
    agencia_broker TEXT,
    abogado TEXT,
    pronto_pago BOOLEAN,
    
    -- Documentación
    rol TEXT,
    caratula TEXT,
    caratula_endoso TEXT,
    fecha_f24 DATE,
    
    -- Endoso
    inversionista TEXT,
    tasa_endoso NUMERIC(9,4),
    
    -- Ubicación
    comuna_bien_raiz TEXT,
    estado_actual TEXT,
    
    -- Fechas de proceso - OE Visado
    oe_visado_inicio DATE,
    oe_visado_termino DATE,
    
    -- Fechas de proceso - Borrador
    borrador_inicio DATE,
    borrador_termino DATE,
    
    -- Fechas de proceso - Pre firma
    pre_firma_inicio DATE,
    pre_firma_termino DATE,
    
    -- Fechas de proceso - Firma Cliente
    firma_cliente_inicio DATE,
    firma_cliente_termino DATE,
    
    -- Fechas de proceso - Firma Codeudores
    firma_codeudores_inicio DATE,
    firma_codeudores_termino DATE,
    
    -- Fechas de proceso - Firma Mandatario
    firma_mandatario_inicio DATE,
    firma_mandatario_termino DATE,
    
    -- Fechas de proceso - Firma Vendedor
    firma_vendedor_inicio DATE,
    firma_vendedor_termino DATE,
    
    -- Fechas de proceso - Firma Alzante
    firma_alzante_inicio DATE,
    rechazo_alzante_inicio DATE,
    rechazo_alzante_termino DATE,
    firma_alzante_termino DATE,
    
    -- Fechas de proceso - Firma Hipotecaria Evoluciona
    firma_hipotecaria_evoluciona_inicio DATE,
    firma_hipotecaria_evoluciona_termino DATE,
    
    -- Fechas de proceso - VB Abogados
    vb_abogados_inicio DATE,
    vb_abogados_termino DATE,
    
    -- Fechas de proceso - Cierre copias
    cierre_copias_inicio DATE,
    cierre_copias_termino DATE,
    
    -- Fechas de proceso - CBR
    cbr_inicio DATE,
    rechazo_cbr_inicio DATE,
    rechazo_cbr_termino DATE,
    cbr_termino DATE,
    
    -- Fechas de proceso - Informe Final
    informe_final_inicio DATE,
    informe_final_termino DATE,
    
    -- Fechas de endoso y desembolso
    fecha_endoso DATE,
    saldo_pendiente_desembolso NUMERIC(18,4),
    fecha_desembolso_pago DATE,
    fecha_prepago_total DATE,
    
    -- Fechas de proceso - Endoso CBR
    endoso_cbr_inicio DATE,
    endoso_cbr_termino DATE,
    
    -- Fechas de proceso - Entrega Escritura
    entrega_esc_inicio DATE,
    entrega_esc_termino DATE,
    
    -- Datos del vendedor
    rut_vendedor TEXT,
    nombre_vendedor TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    
    -- SIN restricciones de llave foránea para carga rápida
);

-- Índices básicos para staging
CREATE INDEX idx_operations_staging_user_id ON operations_staging(user_id);
CREATE INDEX idx_operations_staging_rut_vendedor ON operations_staging(rut_vendedor);

COMMENT ON TABLE operations_staging IS 'Tabla temporal para carga masiva sin restricciones FK';

-- =====================================================
-- TABLA: import_logs
-- =====================================================

CREATE TABLE import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    filas_totales INTEGER NOT NULL DEFAULT 0,
    filas_insertadas INTEGER NOT NULL DEFAULT 0,
    errores JSONB,
    archivo_nombre VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Llave foránea
    CONSTRAINT fk_import_logs_admin 
        FOREIGN KEY (admin_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_import_logs_admin_id ON import_logs(admin_id);
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at DESC);

COMMENT ON TABLE import_logs IS 'Registro de importaciones realizadas por administradores';
COMMENT ON COLUMN import_logs.errores IS 'Errores en formato JSON (si los hay)';

-- =====================================================
-- TRIGGERS: updated_at automático
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operations_staging_updated_at BEFORE UPDATE ON operations_staging
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
