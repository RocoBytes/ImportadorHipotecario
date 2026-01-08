# 🔒 Auditoría de Seguridad - Sistema Importador Hipotecario

**Fecha:** 7 de enero de 2026
**Estado:** Pre-producción

---

## ✅ Seguridad Implementada

### Backend

- ✅ **Helmet**: Headers HTTP seguros
- ✅ **Rate Limiting**:
  - Global: 100 req/min por IP
  - Login: 5 intentos/min
- ✅ **CORS**: Validación de origen con whitelist
- ✅ **JWT Authentication**: Tokens con expiración de 7 días
- ✅ **Bcrypt**: Contraseñas hasheadas con 10 rounds
- ✅ **Class Validator**: DTOs validados automáticamente
- ✅ **TypeORM**: Protección contra SQL injection
- ✅ **File Upload Security**:
  - Tamaño máximo: 10MB
  - Solo archivos .csv permitidos
- ✅ **Environment Variables**: .env en .gitignore

### Frontend

- ✅ **JWT Storage**: Token en localStorage con manejo de expiración
- ✅ **Axios Interceptors**: Logout automático en 401
- ✅ **No XSS Vectors**: Sin innerHTML ni dangerouslySetInnerHTML
- ✅ **Autocomplete**: Habilitado para campos de login

---

## 🔴 VULNERABILIDADES CRÍTICAS

### ~~1. JWT_SECRET Débil (CRÍTICO)~~ ✅ RESUELTO

**Estado:** ✅ **RESUELTO** - 7 de enero de 2026

**Archivo:** `backend/.env`

```bash
# ✅ IMPLEMENTADO
JWT_SECRET=882aa4d36b47c426feddd9c24cd2df9502bc954fdf70701a4a93cbfe9cf94607a19be83d5ab90dc400ed1e0fc905b12d7de16061bb25a066388394738fb58e8a
```

**Solución Implementada:**

1. ✅ Generado JWT_SECRET criptográficamente seguro (128 caracteres hexadecimales)
2. ✅ Actualizado .env con el nuevo secret
3. ✅ Creado script `npm run generate:secret` para generar nuevos secrets
4. ✅ Creado script `npm run security:check` para verificar configuración
5. ✅ Actualizada documentación en .env.example con instrucciones detalladas
6. ✅ Agregado hook `predeploy` que ejecuta security:check automáticamente

**Herramientas Creadas:**

- `backend/scripts/generate-jwt-secret.js` - Generador de secrets
- `backend/scripts/verify-security.js` - Verificador de configuración
- `backend/scripts/README.md` - Documentación de scripts

**Comandos Disponibles:**

```bash
npm run generate:secret  # Generar nuevo JWT_SECRET
npm run security:check   # Verificar configuración de seguridad
npm run predeploy        # Verificar + Build (antes de deploy)
```

**Impacto Previo:** Un atacante podría forjar tokens JWT válidos.
**Mitigación Actual:** Secret de 128 caracteres hexadecimales generado criptográficamente. Imposible de adivinar por fuerza bruta.

---

## 🟡 VULNERABILIDADES MEDIAS

### 2. Tokens en localStorage (XSS Vulnerable)

**Archivos:**

- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/services/api.ts`

**Problema:**
Los tokens JWT almacenados en localStorage son accesibles por cualquier script JavaScript malicioso (XSS attack).

**Solución Recomendada:**

```typescript
// Opción A: httpOnly Cookies (MÁS SEGURO)
// Backend: enviar token como cookie httpOnly
res.cookie("accessToken", token, {
  httpOnly: true,
  secure: true, // Solo HTTPS
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
});

// Frontend: no almacenar token, enviado automáticamente
// Axios configurar: withCredentials: true

// Opción B: Refresh Token Pattern
// - Access token corta vida (15 min) en memoria
// - Refresh token (7 días) en httpOnly cookie
```

**Impacto:** Si un atacante inyecta JavaScript, puede robar tokens de sesión.

**Acción Recomendada:** Implementar antes de producción si hay usuarios externos.

---

### 3. Content Security Policy Deshabilitado

**Archivo:** `backend/src/main.ts`
**Línea:** 16

```typescript
// ❌ ACTUAL
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// ✅ RECOMENDADO
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Solo si es necesario
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Mantener si Swagger lo requiere
  })
);
```

**Impacto:** Sin CSP, el navegador ejecutará cualquier script inyectado.

**Acción Recomendada:** Implementar CSP estricto en producción.

---

### 4. Sin Validación de RUT Chileno

**Archivos:**

- `backend/src/modules/auth/dto/login.dto.ts`
- `backend/src/modules/import/import.service.ts`

**Problema:** El sistema acepta cualquier string como RUT sin validar formato ni dígito verificador.

**Solución:**

```typescript
// Crear validador personalizado de RUT
import { registerDecorator, ValidationOptions } from "class-validator";

export function IsValidRut(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isValidRut",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== "string") return false;

          const cleanRut = value.replace(/[^0-9kK]/g, "");
          if (cleanRut.length < 2) return false;

          const body = cleanRut.slice(0, -1);
          const dv = cleanRut.slice(-1).toUpperCase();

          let sum = 0;
          let multiplier = 2;

          for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
          }

          const expectedDv = 11 - (sum % 11);
          const dvChar =
            expectedDv === 11
              ? "0"
              : expectedDv === 10
              ? "K"
              : String(expectedDv);

          return dv === dvChar;
        },
        defaultMessage: () => "RUT inválido",
      },
    });
  };
}

// Usar en LoginDto
export class LoginDto {
  @IsValidRut({ message: "RUT chileno inválido" })
  @IsNotEmpty()
  rut: string;

  // ...
}
```

**Impacto:** Pueden registrarse usuarios con RUTs falsos.

**Acción Recomendada:** Implementar validación antes de producción.

---

### 5. Contraseñas Temporales Débiles

**Archivo:** `backend/src/modules/import/import.service.ts`
**Línea:** ~45

```typescript
// Patrón actual: primeros 4 dígitos + último dígito
// Ejemplo: 76453723-8 → "76458" (solo 5 dígitos)
```

**Problema:**

- Solo 100,000 combinaciones posibles (00000-99999)
- Predecible si se conoce el RUT

**Solución:**

```typescript
private generatePasswordFromRut(rut: string): string {
  const cleanRut = rut.replace(/[^0-9kK]/g, '');

  // Opción A: Mantener patrón pero forzar cambio inmediato
  // Ya implementado con mustChangePassword = true

  // Opción B: Hash del RUT con salt
  const crypto = require('crypto');
  const salt = process.env.PASSWORD_SALT || 'default_salt_change_me';
  return crypto.createHash('sha256')
    .update(cleanRut + salt)
    .digest('hex')
    .substring(0, 12); // 12 caracteres alfanuméricos
}
```

**Acción Actual:** ✅ Ya implementado `mustChangePassword = true`, lo que obliga al usuario a cambiar la contraseña temporal en el primer login.

**Recomendación:** Considerar forzar cambio de contraseña antes de permitir acceso al dashboard.

---

### 6. Sin Protección CSRF

**Archivos:** Todos los controladores POST/PUT/DELETE

**Problema:** No hay tokens CSRF para operaciones de escritura.

**Solución:**

```bash
npm install csurf cookie-parser
```

```typescript
// main.ts
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

app.use(cookieParser());
app.use(csurf({ cookie: true }));

// Endpoint para obtener token CSRF
@Get('csrf-token')
getCsrfToken(@Req() req) {
  return { csrfToken: req.csrfToken() };
}
```

**Impacto:** Un atacante podría engañar a un usuario autenticado para ejecutar acciones no deseadas.

**Acción Recomendada:** Implementar si hay usuarios externos o acceso público.

---

## 🟠 VULNERABILIDADES BAJAS

### 7. FRONTEND_URL No Configurada para Producción

**Archivo:** `backend/.env.example`

```bash
# ❌ ACTUAL
FRONTEND_URL=http://localhost:5173

# ✅ PRODUCCIÓN
FRONTEND_URL=https://tu-app.vercel.app,http://localhost:5173
```

**Acción:** Actualizar variable de entorno en Render antes del despliegue.

---

### 8. Sin Logging de Eventos de Seguridad

**Problema:** No hay registro de:

- Intentos de login fallidos
- Cambios de contraseña
- Accesos denegados por CORS
- Rate limiting activado

**Solución:**

```typescript
// Crear security.service.ts
@Injectable()
export class SecurityService {
  async logSecurityEvent(event: {
    type: "LOGIN_FAILED" | "PASSWORD_CHANGED" | "CORS_BLOCKED" | "RATE_LIMITED";
    userId?: string;
    ip: string;
    details: any;
  }) {
    // Guardar en DB o servicio de logs (Sentry, LogRocket, etc.)
    console.warn(`[SECURITY] ${event.type}`, event);
  }
}
```

**Acción Recomendada:** Implementar antes de producción para auditoría.

---

### 9. Sin Límite de Sesiones Concurrentes

**Problema:** Un usuario puede tener múltiples tokens JWT válidos simultáneamente.

**Solución:**

```typescript
// Opción A: Revocar tokens anteriores en nuevo login
// Mantener lista de tokens revocados en Redis

// Opción B: Single session per user
// Guardar sessionId en DB, invalidar al generar nuevo token
```

**Acción:** Considerar si es requerimiento del negocio.

---

### 10. Dependencias con Vulnerabilidades

**Problema:** npm audit reportó vulnerabilidades.

**Solución:**

```bash
# Revisar y actualizar
npm audit
npm audit fix

# Si hay vulnerabilidades sin fix:
npm audit fix --force  # Con precaución
```

**Acción:** Ejecutar antes de producción.

---

## 📋 CHECKLIST PRE-PRODUCCIÓN

### Crítico (Antes de Deploy)

- [x] ✅ Generar JWT_SECRET seguro (128 caracteres hex) - **COMPLETADO**
- [x] ✅ Crear scripts de verificación de seguridad - **COMPLETADO**
- [x] ✅ Configurar FRONTEND_URL en .env - **COMPLETADO**
- [ ] Configurar FRONTEND_URL con dominio de Vercel en producción
- [x] ✅ Verificar que .env esté en .gitignore - **COMPLETADO**
- [ ] Activar DB_SSL=true para Supabase (en producción)
- [ ] Ejecutar `npm run security:check` antes de deploy
- [ ] Ejecutar `npm audit fix`

### Importante (Primera semana)

- [ ] Implementar validación de RUT chileno
- [ ] Activar CSP en producción
- [ ] Configurar logging de seguridad
- [ ] Revisar contraseñas temporales generadas

### Recomendado (Primer mes)

- [ ] Migrar tokens a httpOnly cookies
- [ ] Implementar refresh token pattern
- [ ] Agregar protección CSRF
- [ ] Monitorear logs de seguridad
- [ ] Configurar alertas de seguridad (Sentry)

### Opcional (Mejora continua)

- [ ] Implementar 2FA para ADMIN
- [ ] Límite de sesiones concurrentes
- [ ] Auditoría de accesos (quién vio qué)
- [ ] Encriptación de datos sensibles en DB
- [ ] WAF (Web Application Firewall)

---

## 🚨 PLAN DE RESPUESTA A INCIDENTES

### Si se detecta brecha de seguridad:

1. **Contención Inmediata**

   - Rotar JWT_SECRET (invalida todos los tokens)
   - Deshabilitar endpoints de importación
   - Bloquear IPs sospechosas

2. **Investigación**

   - Revisar logs de acceso
   - Identificar datos comprometidos
   - Determinar vector de ataque

3. **Remediación**

   - Parchear vulnerabilidad
   - Notificar usuarios afectados
   - Forzar cambio de contraseñas

4. **Prevención**
   - Actualizar dependencias
   - Revisar código fuente
   - Implementar medidas adicionales

---

## 📞 CONTACTOS

**Desarrollador:** Rodrigo Contreras
**Fecha Última Revisión:** 7 de enero de 2026
**Próxima Auditoría:** Al desplegar en producción

---

## 📚 REFERENCIAS

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [CORS Configuration Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
