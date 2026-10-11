import { api } from './client';
import type { ServiceabilityCheck } from './types';

export async function checkPincode(pinCode: string): Promise<ServiceabilityCheck> {
  return api.get<ServiceabilityCheck>(`/serviceability/pincode/${pinCode}`, { auth: false });
}

export async function listBranches(): Promise<unknown[]> {
  const data = await api.get<unknown[] | { items?: unknown[] }>('/serviceability/branches', {
    auth: false,
  });
  return Array.isArray(data) ? data : (data as any)?.items ?? [];
}
