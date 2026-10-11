import { api } from './client';

export interface StoreContactInfo {
  storeName?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  supportEmail?: string | null;
  website?: string | null;
  bannerUrls?: string[];
}

let cache: StoreContactInfo | null = null;

export async function getContactInfo(force = false): Promise<StoreContactInfo> {
  if (cache && !force) return cache;
  try {
    const data = await api.get<StoreContactInfo>('/settings/contact', { auth: false });
    cache = data ?? {};
    return cache;
  } catch {
    return {};
  }
}
