-- =====================================================
-- Script DDL para Importador Hipotecario
-- Base de Datos: PostgreSQL
-- =====================================================

-- Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TIPOS ENUMERADOS
-- =====================================================

-- Enum para roles de usuario
CREATE TYPE user_role AS ENUM ('ADMIN', 'VENDEDOR');

-- =====================================================
-- TABLA: users
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(12) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    rol user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice en RUT para búsquedas rápidas
CREATE INDEX idx_users_rut ON users(rut);

-- Comentarios
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
COMMENT ON COLUMN users.rut IS 'RUT sin puntos y con guion (ej: 12345678-9)';
COMMENT ON COLUMN users.must_change_password IS 'Indica si el usuario debe cambiar su contraseña en el próximo login';

-- =====================================================
-- TABLA: operations (Tabla Final)
-- =====================================================

CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Columnas del CSV (84 columnas)
    fecha_creacion DATE,
    dias_tasa INTEGER,
    tipo VARCHAR(50),
    solicitud VARCHAR(50),
    estado_solicitud VARCHAR(100),
    fecha_resolucion DATE,
    fecha_aprobacion_manual DATE,
    fecha_escritura DATE,
    estado_mutuo VARCHAR(100),
    mutuo VARCHAR(100),
    rut VARCHAR(12),
    nombre VARCHAR(255),
    apellido_paterno VARCHAR(255),
    apellido_materno VARCHAR(255),
    ejecutivo VARCHAR(255),
    ejecutivo_operaciones VARCHAR(255),
    tipo_operacion VARCHAR(100),
    valor_venta DECIMAL(15, 2),
    valor_asegurable DECIMAL(15, 2),
    monto_pie DECIMAL(15, 2),
    monto_subsidio DECIMAL(15, 2),
    credito_total DECIMAL(15, 2),
    monto_hipoteca DECIMAL(15, 2),
    fines_generales DECIMAL(15, 2),
    gastos_operacionales DECIMAL(15, 2),
    no_financiado DECIMAL(15, 2),
    valor_tasacion DECIMAL(15, 2),
    plazo INTEGER,
    periodo_gracia INTEGER,
    tasa_emision DECIMAL(10, 4),
    banco_alzante VARCHAR(255),
    repertorio VARCHAR(100),
    notaria VARCHAR(255),
    agencia_broker VARCHAR(255),
    abogado VARCHAR(255),
    pronto_pago VARCHAR(50),
    rol VARCHAR(100),
    caratula VARCHAR(100),
    caratula_endoso VARCHAR(100),
    fecha_f24 DATE,
    inversionista VARCHAR(255),
    tasa_endoso DECIMAL(10, 4),
    comuna_bien_raiz VARCHAR(255),
    estado_actual VARCHAR(100),
    oe_visado_inicio DATE,
    oe_visado_termino DATE,
    borrador_inicio DATE,
    borrador_termino DATE,
    pre_firma_inicio DATE,
    pre_firma_termino DATE,
    firma_cliente_inicio DATE,
    firma_cliente_termino DATE,
    firma_codeudores_inicio DATE,
    firma_codeudores_termino DATE,
    firma_mandatario_inicio DATE,
    firma_mandatario_termino DATE,
    firma_vendedor_inicio DATE,
    firma_vendedor_termino DATE,
    firma_alzante_inicio DATE,
    rechazo_alzante_inicio DATE,
    rechazo_alzante_termino DATE,
    firma_alzante_termino DATE,
    firma_hipotecaria_evoluciona_inicio DATE,
    firma_hipotecaria_evoluciona_termino DATE,
    vb_abogados_inicio DATE,
    vb_abogados_termino DATE,
    cierre_copias_inicio DATE,
    cierre_copias_termino DATE,
    cbr_inicio DATE,
    rechazo_cbr_inicio DATE,
    rechazo_cbr_termino DATE,
    cbr_termino DATE,
    informe_final_inicio DATE,
    informe_final_termino DATE,
    fecha_endoso DATE,
    saldo_pendiente_desembolso DECIMAL(15, 2),
    fecha_desembolso_pago DATE,
    fecha_prepago_total DATE,
    endoso_cbr_inicio DATE,
    endoso_cbr_termino DATE,
    entrega_esc_inicio DATE,
    entrega_esc_termino DATE,
    rut_vendedor VARCHAR(12),
    nombre_vendedor VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Llave foránea
    CONSTRAINT fk_operations_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_operations_user_id ON operations(user_id);
CREATE INDEX idx_operations_mutuo ON operations(mutuo);
CREATE INDEX idx_operations_estado_mutuo ON operations(estado_mutuo);
CREATE INDEX idx_operations_fecha_escritura ON operations(fecha_escritura);
CREATE INDEX idx_operations_rut ON operations(rut);
CREATE INDEX idx_operations_estado_actual ON operations(estado_actual);
CREATE INDEX idx_operations_fecha_creacion ON operations(fecha_creacion);

-- Comentarios
COMMENT ON TABLE operations IS 'Tabla final de operaciones hipotecarias con todas las columnas del CSV';

-- =====================================================
-- TABLA: operations_staging (Mesa de trabajo)
-- =====================================================

CREATE TABLE operations_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Columnas del CSV (84 columnas) - igual que operations
    fecha_creacion DATE,
    dias_tasa INTEGER,
    tipo VARCHAR(50),
    solicitud VARCHAR(50),
    estado_solicitud VARCHAR(100),
    fecha_resolucion DATE,
    fecha_aprobacion_manual DATE,
    fecha_escritura DATE,
    estado_mutuo VARCHAR(100),
    mutuo VARCHAR(100),
    rut VARCHAR(12),
    nombre VARCHAR(255),
    apellido_paterno VARCHAR(255),
    apellido_materno VARCHAR(255),
    ejecutivo VARCHAR(255),
    ejecutivo_operaciones VARCHAR(255),
    tipo_operacion VARCHAR(100),
    valor_venta DECIMAL(15, 2),
    valor_asegurable DECIMAL(15, 2),
    monto_pie DECIMAL(15, 2),
    monto_subsidio DECIMAL(15, 2),
    credito_total DECIMAL(15, 2),
    monto_hipoteca DECIMAL(15, 2),
    fines_generales DECIMAL(15, 2),
    gastos_operacionales DECIMAL(15, 2),
    no_financiado DECIMAL(15, 2),
    valor_tasacion DECIMAL(15, 2),
    plazo INTEGER,
    periodo_gracia INTEGER,
    tasa_emision DECIMAL(10, 4),
    banco_alzante VARCHAR(255),
    repertorio VARCHAR(100),
    notaria VARCHAR(255),
    agencia_broker VARCHAR(255),
    abogado VARCHAR(255),
    pronto_pago VARCHAR(50),
    rol VARCHAR(100),
    caratula VARCHAR(100),
    caratula_endoso VARCHAR(100),
    fecha_f24 DATE,
    inversionista VARCHAR(255),
    tasa_endoso DECIMAL(10, 4),
    comuna_bien_raiz VARCHAR(255),
    estado_actual VARCHAR(100),
    oe_visado_inicio DATE,
    oe_visado_termino DATE,
    borrador_inicio DATE,
    borrador_termino DATE,
    pre_firma_inicio DATE,
    pre_firma_termino DATE,
    firma_cliente_inicio DATE,
    firma_cliente_termino DATE,
    firma_codeudores_inicio DATE,
    firma_codeudores_termino DATE,
    firma_mandatario_inicio DATE,
    firma_mandatario_termino DATE,
    firma_vendedor_inicio DATE,
    firma_vendedor_termino DATE,
    firma_alzante_inicio DATE,
    rechazo_alzante_inicio DATE,
    rechazo_alzante_termino DATE,
    firma_alzante_termino DATE,
    firma_hipotecaria_evoluciona_inicio DATE,
    firma_hipotecaria_evoluciona_termino DATE,
    vb_abogados_inicio DATE,
    vb_abogados_termino DATE,
    cierre_copias_inicio DATE,
    cierre_copias_termino DATE,
    cbr_inicio DATE,
    rechazo_cbr_inicio DATE,
    rechazo_cbr_termino DATE,
    cbr_termino DATE,
    informe_final_inicio DATE,
    informe_final_termino DATE,
    fecha_endoso DATE,
    saldo_pendiente_desembolso DECIMAL(15, 2),
    fecha_desembolso_pago DATE,
    fecha_prepago_total DATE,
    endoso_cbr_inicio DATE,
    endoso_cbr_termino DATE,
    entrega_esc_inicio DATE,
    entrega_esc_termino DATE,
    rut_vendedor VARCHAR(12),
    nombre_vendedor VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    
    -- SIN restricciones de llave foránea para carga rápida
);

-- Índices básicos para staging
CREATE INDEX idx_operations_staging_user_id ON operations_staging(user_id);
CREATE INDEX idx_operations_staging_mutuo ON operations_staging(mutuo);

-- Comentarios
COMMENT ON TABLE operations_staging IS 'Tabla temporal para carga masiva de datos sin restricciones FK';

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

-- Índice en admin_id para consultar logs por administrador
CREATE INDEX idx_import_logs_admin_id ON import_logs(admin_id);

-- Índice en fecha de creación para consultas temporales
CREATE INDEX idx_import_logs_created_at ON import_logs(created_at DESC);

-- Comentarios
COMMENT ON TABLE import_logs IS 'Registro de importaciones de datos realizadas por administradores';
COMMENT ON COLUMN import_logs.errores IS 'Detalles de errores encontrados durante la importación en formato JSON';

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para operations
CREATE TRIGGER update_operations_updated_at 
    BEFORE UPDATE ON operations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para operations_staging
CREATE TRIGGER update_operations_staging_updated_at 
    BEFORE UPDATE ON operations_staging
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Usuario administrador de ejemplo
-- Contraseña: admin123 (deberás generar el hash real con tu librería)
-- INSERT INTO users (rut, password_hash, rol, must_change_password) 
-- VALUES ('11111111-1', 'HASH_AQUI', 'ADMIN', true);

-- Usuario vendedor de ejemplo
-- INSERT INTO users (rut, password_hash, rol, must_change_password) 
-- VALUES ('22222222-2', 'HASH_AQUI', 'VENDEDOR', true);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
