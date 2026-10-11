import type { UserSummary } from '../api/types';

const PLACEHOLDER_NAMES = new Set(['solassist customer', 'customer']);

export function displayName(user: UserSummary | null | undefined): string {
  const name = user?.fullName?.trim();
  if (name && !PLACEHOLDER_NAMES.has(name.toLowerCase())) return name;
  return 'Customer';
}

export function firstName(user: UserSummary | null | undefined): string {
  return displayName(user).split(/\s+/)[0];
}

/** Email-only accounts get a generated +91000… phone number; never show it. */
export function displayPhone(user: UserSummary | null | undefined): string | null {
  return formatPhone(user?.phoneNumber);
}

export function formatPhone(raw: string | null | undefined): string | null {
  const phone = raw?.trim();
  if (!phone || phone.startsWith('+91000')) return null;
  return phone.startsWith('+91') ? `+91 ${phone.slice(3)}` : phone;
}

/** Real name for prefilling forms; empty instead of the "Customer" placeholder. */
export function realName(user: UserSummary | null | undefined): string {
  const name = displayName(user);
  return name === 'Customer' ? '' : name;
}

export function displayContact(user: UserSummary | null | undefined): string {
  return user?.email?.trim() || displayPhone(user) || 'Add your email or phone';
}

export function statusLabel(user: UserSummary | null | undefined): { text: string; verified: boolean } {
  switch (user?.status) {
    case 'ACTIVE':
      return { text: 'Verified User', verified: true };
    case 'PENDING_VERIFICATION':
      return { text: 'Verification Pending', verified: false };
    case 'SUSPENDED':
      return { text: 'Account Suspended', verified: false };
    case 'DEACTIVATED':
      return { text: 'Account Deactivated', verified: false };
    default:
      return { text: 'Guest', verified: false };
  }
}
