/**
 * Utilidades para manejo de RUT chileno
 */

/**
 * Normaliza un RUT eliminando puntos y espacios
 * Ejemplo: "12.345.678-9" -> "12345678-9"
 * @param rut RUT sin normalizar
 * @returns RUT normalizado
 */
export function normalizeRut(rut: string): string {
  if (!rut) return '';
  
  // Eliminar puntos, espacios y convertir a mayúsculas
  return rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
}

/**
 * Valida el formato básico de un RUT
 * Debe tener formato: 12345678-9 o 1-9
 * @param rut RUT a validar
 * @returns true si tiene formato válido
 */
export function isValidRutFormat(rut: string): boolean {
  if (!rut) return false;
  
  const normalizedRut = normalizeRut(rut);
  
  // Formato: números-dígito_verificador (1-9 o 12345678-9 o 12345678-K)
  const rutRegex = /^\d{1,8}-[\dkK]$/;
  
  return rutRegex.test(normalizedRut);
}

/**
 * Calcula el dígito verificador de un RUT
 * @param rutNumber Número del RUT sin dígito verificador
 * @returns Dígito verificador (0-9 o K)
 */
export function calculateRutVerifier(rutNumber: string | number): string {
  const rutStr = rutNumber.toString();
  let sum = 0;
  let multiplier = 2;

  // Recorrer de derecha a izquierda
  for (let i = rutStr.length - 1; i >= 0; i--) {
    sum += parseInt(rutStr[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const verifier = 11 - remainder;

  if (verifier === 11) return '0';
  if (verifier === 10) return 'K';
  return verifier.toString();
}

/**
 * Valida si el dígito verificador del RUT es correcto
 * @param rut RUT completo con formato 12345678-9
 * @returns true si el dígito verificador es válido
 */
export function isValidRutVerifier(rut: string): boolean {
  if (!isValidRutFormat(rut)) return false;

  const normalizedRut = normalizeRut(rut);
  const [rutNumber, verifier] = normalizedRut.split('-');
  
  const calculatedVerifier = calculateRutVerifier(rutNumber);
  
  return calculatedVerifier === verifier.toUpperCase();
}

/**
 * Formatea un RUT agregando puntos
 * Ejemplo: "12345678-9" -> "12.345.678-9"
 * @param rut RUT sin formato
 * @returns RUT formateado
 */
export function formatRut(rut: string): string {
  const normalizedRut = normalizeRut(rut);
  
  if (!isValidRutFormat(normalizedRut)) return rut;
  
  const [rutNumber, verifier] = normalizedRut.split('-');
  
  // Agregar puntos cada 3 dígitos de derecha a izquierda
  const formattedNumber = rutNumber
    .split('')
    .reverse()
    .map((digit, index) => {
      if (index > 0 && index % 3 === 0) {
        return digit + '.';
      }
      return digit;
    })
    .reverse()
    .join('');
  
  return `${formattedNumber}-${verifier}`;
}
