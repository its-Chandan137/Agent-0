export const countryCodes = ['+91', '+1', '+44', '+61', '+971'];

export function buildE164Phone(countryCode, phone) {
  const normalizedCode = String(countryCode || '+91').trim();
  const digits = String(phone || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return `${normalizedCode}${digits}`;
}
