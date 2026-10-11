/** Keep in step with solassist-backend phone.util.ts */

export function normalizeIndianPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  let national = digits;
  if (national.length === 12 && national.startsWith('91')) {
    national = national.slice(2);
  } else if (national.length === 11 && national.startsWith('0')) {
    national = national.slice(1);
  }
  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

export function canonicalIdentifier(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const phone = normalizeIndianPhone(trimmed);
  if (!phone) {
    throw new Error('Enter a valid 10-digit mobile number.');
  }
  return phone;
}

export function isAlreadyRegisteredMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes('already') && (msg.includes('register') || msg.includes('exist'));
}
