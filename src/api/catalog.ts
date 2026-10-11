import { api } from './client';
import { API_BASE_URL } from '../config/env';
import type { Brand, Category, Product } from './types';

export async function listProducts(params?: {
  type?: string;
  brand?: string;
  search?: string;
}): Promise<Product[]> {
  const data = await api.get<Product[] | { items?: Product[] }>('/catalog', {
    auth: false,
    query: params,
  });
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getProduct(id: string): Promise<Product> {
  return api.get<Product>(`/catalog/${id}`, { auth: false });
}

export async function listCategories(): Promise<Category[]> {
  const data = await api.get<Category[] | { items?: Category[] }>('/catalog/categories', {
    auth: false,
  });
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function listBrands(): Promise<Brand[]> {
  const data = await api.get<Brand[] | { items?: Brand[] }>('/catalog/brands', { auth: false });
  return Array.isArray(data) ? data : data?.items ?? [];
}

export function isActiveBrand(brand: Brand): boolean {
  return !brand.status || brand.status.toLowerCase() === 'active';
}

/**
 * Loadable logo URL for a brand. The admin panel has saved browser-only
 * `blob:` preview URLs in the past; those can never load outside the admin tab.
 */
export function brandLogoUri(brand: Pick<Brand, 'logoUrl'>): string | undefined {
  const raw = brand.logoUrl?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw) || /^data:image\//i.test(raw)) return raw;
  if (raw.startsWith('/')) {
    const match = API_BASE_URL.match(/^https?:\/\/[^/]+/i);
    return match ? `${match[0]}${raw}` : undefined;
  }
  return undefined;
}

export async function listPackages(): Promise<Product[]> {
  const data = await api.get<Product[] | { items?: Product[] }>('/catalog/packages', {
    auth: false,
  });
  return Array.isArray(data) ? data : data?.items ?? [];
}

/**
 * Customer-facing price. Only the RETAIL tier is used: other tiers are dealer
 * prices, and the backend refuses to order products without a RETAIL price.
 *
 * `basePrice` excludes GST while `mrp` includes it, so the MRP is converted to
 * its pre-GST equivalent; otherwise the GST itself would show up as a discount.
 */
export function getRetailPrice(product: Product): { base: number; mrp: number } {
  const retail = (product.prices ?? []).find((p) => p.priceTier === 'RETAIL');
  const rawBase = retail ? Number(retail.basePrice) : 0;
  const base = Number.isFinite(rawBase) && rawBase > 0 ? rawBase : 0;
  const rawMrp = retail ? Number(retail.mrp) : 0;
  const gst = Number(product.gstRatePercent);
  const mrpExGst = Number.isFinite(rawMrp) && rawMrp > 0 ? rawMrp / (1 + (Number.isFinite(gst) && gst > 0 ? gst : 0) / 100) : 0;
  const mrp = Math.round(mrpExGst * 100) / 100;
  return { base, mrp: mrp > base ? mrp : base };
}

export function isPurchasable(product: Product): boolean {
  return product.isActive !== false && getRetailPrice(product).base > 0;
}

export function formatInr(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function discountPercent(base: number, mrp: number): string | undefined {
  if (!mrp || mrp <= base) return undefined;
  const pct = Math.round(((mrp - base) / mrp) * 100);
  return pct > 0 ? `${pct}% OFF` : undefined;
}

export function productImageSource(product: Product, fallback: any) {
  const uri = product.images?.[0];
  return uri ? { uri } : fallback;
}
