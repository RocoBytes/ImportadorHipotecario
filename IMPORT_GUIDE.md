# 📥 Guía de Importación - Módulo Import

## 📋 Arquitectura Implementada

### Algoritmo de Importación (5 Pasos)

```
1. PARSING & FILTRADO
   ↓ Lee CSV con delimitador ;
   ↓ Filtra Estado Mutuo == 'Vigente'

2. SYNC USUARIOS
   ↓ Extrae RUTs únicos del campo "RUT Ejecutivo"
   ↓ Busca en DB users
   ↓ Crea nuevos usuarios con rol VENDEDOR
   ↓ Genera Map<RUT, UserID>

3. CARGA A STAGING
   ↓ Limpia operations_staging
   ↓ Transforma fechas Excel → Date JS
   ↓ Transforma montos (coma → punto)
   ↓ Normaliza RUTs
   ↓ Inserta en staging

4. SWAP TRANSACCIONAL
   ↓ BEGIN TRANSACTION
   ↓ TRUNCATE operations
   ↓ INSERT INTO operations SELECT * FROM staging
   ↓ TRUNCATE staging
   ↓ COMMIT

5. LOG
   ↓ Guarda registro en import_logs
```

## 🎯 Endpoints Disponibles

### 1. Subir Archivo CSV (Solo ADMIN)

**POST** `/api/import/upload`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (form-data):**

```
file: [archivo.csv]
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Importación completada exitosamente",
  "filasTotales": 1500,
  "filasVigentes": 1200,
  "filasInsertadas": 1200,
  "usuariosCreados": 15,
  "logId": "uuid-del-log"
}
```

### 2. Ver Todos los Logs (Solo ADMIN)

**GET** `/api/import/logs`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Respuesta:**

```json
[
  {
    "id": "uuid",
    "adminId": "uuid",
    "admin": {
      "id": "uuid",
      "rut": "1-9",
      "rol": "ADMIN"
    },
    "filasTotales": 1500,
    "filasInsertadas": 1200,
    "errores": null,
    "archivoNombre": "mutuos_enero.csv",
    "createdAt": "2025-12-31T10:30:00Z"
  }
]
```

### 3. Ver Mis Logs (Solo ADMIN)

**GET** `/api/import/my-logs`

**Headers:**

```
Authorization: Bearer <admin_token>
```

## 📄 Formato del CSV

### Delimitador

- **Separador:** `;` (punto y coma)

### Columnas Requeridas

| Columna         | Descripción         | Ejemplo                        |
| --------------- | ------------------- | ------------------------------ |
| RUT Ejecutivo   | RUT del vendedor    | `12345678-9`                   |
| Estado Mutuo    | Estado del mutuo    | `Vigente`                      |
| ID Mutuo        | Identificador único | `MT-2024-001`                  |
| Fecha Escritura | Fecha de escritura  | `31/12/2024` o serial Excel    |
| Valor Venta     | Monto de venta      | `150.000.000` o `150000000,50` |
| RUT Cliente     | RUT del cliente     | `98765432-1`                   |
| Nombre Cliente  | Nombre del cliente  | `Juan Pérez`                   |

### Columnas Adicionales

Cualquier columna extra se guardará automáticamente en el campo JSONB `detalles_extra`.

### Ejemplo de CSV

```csv
RUT Ejecutivo;Estado Mutuo;ID Mutuo;Fecha Escritura;Valor Venta;RUT Cliente;Nombre Cliente;Banco;Tasa
12345678-9;Vigente;MT-001;31/12/2024;150.000.000;11111111-1;Juan Pérez;Banco Chile;4.5
98765432-1;Vigente;MT-002;15/12/2024;200.500.000,50;22222222-2;María González;Banco Estado;4.2
11223344-5;Rechazado;MT-003;10/12/2024;100.000.000;33333333-3;Pedro Silva;BCI;4.8
```

**Resultado:** Solo las filas con `Estado Mutuo = Vigente` se importarán (2 de 3).

## 🔄 Transformaciones Automáticas

### 1. Normalización de RUT

```javascript
Entrada:  "12.345.678-9"  →  Salida: "12345678-9"
Entrada:  "1-9"           →  Salida: "1-9"
```

### 2. Conversión de Fechas

**Fecha Excel (serial):**

```javascript
Entrada:  45292  →  Salida: Date("2024-12-31")
```

**Fecha DD/MM/YYYY:**

```javascript
Entrada:  "31/12/2024"  →  Salida: Date("2024-12-31")
```

### 3. Conversión de Montos

```javascript
Entrada:  "150.000.000"     →  Salida: 150000000
Entrada:  "150.000.000,50"  →  Salida: 150000000.50
Entrada:  "150000000"       →  Salida: 150000000
```

## 👥 Sincronización de Usuarios

### Usuarios Nuevos

Cuando se detecta un RUT en "RUT Ejecutivo" que no existe:

```javascript
{
  rut: "12345678-9",
  rol: "VENDEDOR",
  password: "temporal123", // Hash bcrypt
  mustChangePassword: true
}
```

⚠️ **Importante:** Los vendedores creados automáticamente deben cambiar su contraseña en el primer login.

### Usuarios Existentes

Si el RUT ya existe en la base de datos, se reutiliza sin modificar.

## 🔒 Seguridad y Validaciones

### Validaciones de Archivo

- ✅ Solo archivos `.csv`
- ✅ Tamaño máximo: 10MB (configurable en `MAX_FILE_SIZE`)
- ✅ Solo usuarios con rol `ADMIN` pueden importar

### Validaciones de Datos

- ✅ Debe existir al menos 1 fila con Estado Mutuo = "Vigente"
- ✅ RUT Ejecutivo debe ser válido
- ✅ Fechas inválidas se convierten en `null`
- ✅ Montos inválidos se convierten en `null`

## 🎯 Casos de Uso

### Caso 1: Importación Exitosa

```bash
curl -X POST http://localhost:3000/api/import/upload \
  -H "Authorization: Bearer <admin_token>" \
  -F "file=@mutuos_enero.csv"
```

**Resultado:**

- ✅ 1200 registros vigentes insertados
- ✅ 15 vendedores nuevos creados
- ✅ Datos antiguos reemplazados
- ✅ Log guardado

### Caso 2: Sin Registros Vigentes

**Archivo CSV:**

```csv
RUT Ejecutivo;Estado Mutuo;...
12345678-9;Rechazado;...
98765432-1;Cancelado;...
```

**Error:**

```json
{
  "statusCode": 400,
  "message": "No se encontraron registros con Estado Mutuo \"Vigente\""
}
```

### Caso 3: Formato Inválido

**Error:**

```json
{
  "statusCode": 400,
  "message": "Solo se permiten archivos CSV"
}
```

## 📊 Estructura de Datos

### Tabla: operations

```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL FK
id_mutuo        VARCHAR(50)
estado_mutuo    VARCHAR(100)
fecha_escritura DATE
valor_venta     DECIMAL(15,2)
rut_cliente     VARCHAR(12)
nombre_cliente  VARCHAR(255)
detalles_extra  JSONB
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Tabla: operations_staging

Estructura idéntica a `operations` pero **sin restricciones FK** para carga rápida.

### Tabla: import_logs

```sql
id                UUID PRIMARY KEY
admin_id          UUID NOT NULL FK
filas_totales     INTEGER
filas_insertadas  INTEGER
errores           JSONB
archivo_nombre    VARCHAR(255)
created_at        TIMESTAMP
```

## ⚡ Performance

### Optimizaciones Implementadas

1. **Inserción por lotes:** 500 registros a la vez
2. **Sin FKs en staging:** Carga más rápida
3. **Transacción única:** Swap atómico
4. **Mapa en memoria:** Para resolución de usuarios

### Tiempos Estimados

| Registros | Tiempo |
| --------- | ------ |
| 1,000     | ~2s    |
| 10,000    | ~15s   |
| 50,000    | ~1m    |
| 100,000   | ~2m    |

## 🛠️ Testing con cURL

### 1. Obtener Token de Admin

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"rut":"1-9","password":"1234"}' \
  | jq -r '.accessToken')

echo $TOKEN
```

### 2. Importar CSV

```bash
curl -X POST http://localhost:3000/api/import/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@ruta/al/archivo.csv"
```

### 3. Ver Logs

```bash
curl -X GET http://localhost:3000/api/import/logs \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

### Error: "Solo se permiten archivos CSV"

**Solución:** Asegúrate de que el archivo tenga extensión `.csv`

### Error: "No se encontraron registros vigentes"

**Solución:** Verifica que el CSV tenga al menos una fila con `Estado Mutuo = Vigente`

### Error: "Token inválido"

**Solución:** Genera un nuevo token haciendo login

### Warning: "Usuario no encontrado para RUT"

**Causa:** El RUT Ejecutivo está vacío o mal formateado en el CSV
**Solución:** Corrige el CSV y reimporta

## 📝 Notas Importantes

- ⚠️ **TRUNCATE:** Cada importación reemplaza TODOS los datos anteriores
- ⚠️ **Vendedores:** Se crean automáticamente con password temporal
- ⚠️ **Vigente:** Solo se importan registros con este estado
- ⚠️ **Logs:** Se guardan aunque la importación falle
- ⚠️ **Transacciones:** Si falla el swap, se hace rollback automático

## 🚀 Próximos Pasos

1. ✅ Módulo de importación implementado
2. 🔄 Frontend para subir archivos
3. 🔄 Módulo de consulta de operaciones
4. 🔄 Dashboards y reportes
