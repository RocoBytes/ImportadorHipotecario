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
    id_mutuo VARCHAR(50),
    estado_mutuo VARCHAR(100),
    fecha_escritura DATE,
    valor_venta DECIMAL(15, 2),
    rut_cliente VARCHAR(12),
    nombre_cliente VARCHAR(255),
    detalles_extra JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Llave foránea
    CONSTRAINT fk_operations_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Índice compuesto para búsquedas por usuario y estado
CREATE INDEX idx_operations_user_estado ON operations(user_id, estado_mutuo);

-- Índice en id_mutuo
CREATE INDEX idx_operations_id_mutuo ON operations(id_mutuo);

-- Índice en fecha_escritura para reportes temporales
CREATE INDEX idx_operations_fecha_escritura ON operations(fecha_escritura);

-- Índice GIN en JSONB para consultas eficientes
CREATE INDEX idx_operations_detalles_extra ON operations USING GIN (detalles_extra);

-- Comentarios
COMMENT ON TABLE operations IS 'Tabla final de operaciones hipotecarias';
COMMENT ON COLUMN operations.detalles_extra IS 'Columnas adicionales en formato JSON';

-- =====================================================
-- TABLA: operations_staging (Mesa de trabajo)
-- =====================================================

CREATE TABLE operations_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    id_mutuo VARCHAR(50),
    estado_mutuo VARCHAR(100),
    fecha_escritura DATE,
    valor_venta DECIMAL(15, 2),
    rut_cliente VARCHAR(12),
    nombre_cliente VARCHAR(255),
    detalles_extra JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    
    -- SIN restricciones de llave foránea para carga rápida
);

-- Índices básicos para staging
CREATE INDEX idx_operations_staging_user_id ON operations_staging(user_id);
CREATE INDEX idx_operations_staging_id_mutuo ON operations_staging(id_mutuo);

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
