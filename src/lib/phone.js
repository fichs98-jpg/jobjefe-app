// Normaliza un número de teléfono para WhatsApp (formato E.164)
export function normalizePhone(raw) {
  if (!raw) return ''
  // Quitar todo excepto dígitos y +
  let clean = raw.replace(/[^\d+]/g, '')
  // Si ya tiene + al inicio, está bien
  if (clean.startsWith('+')) return clean
  // Número colombiano: 10 dígitos que empieza en 3 → +57XXXXXXXXXX
  if (clean.length === 10 && clean.startsWith('3')) return '+57' + clean
  // Número colombiano con 57 adelante: 12 dígitos → +57XXXXXXXXXX
  if (clean.length === 12 && clean.startsWith('57')) return '+' + clean
  // Número USA: 10 dígitos → +1XXXXXXXXXX
  if (clean.length === 10 && !clean.startsWith('0')) return '+1' + clean
  // Número USA con 1 adelante: 11 dígitos → +1XXXXXXXXXX
  if (clean.length === 11 && clean.startsWith('1')) return '+' + clean
  // Cualquier otro caso — agregar + si no lo tiene
  return '+' + clean
}
