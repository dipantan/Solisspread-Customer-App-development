import type { Product, ProductType } from '../api/types';

/**
 * Normalised, customer-safe view of a product.
 *
 * The admin panel stores rich content under `specifications.ui` (specList,
 * features, short/long description, warranty, tags, …). Older products may
 * keep flat key/value pairs directly on `specifications`. Internal fields such
 * as purchase/dealer prices and stock levels are never read here.
 */
export interface ProductContent {
  typeLabel: string;
  category?: string;
  subCategory?: string;
  tags: string[];
  badge?: string;
  shortDescription?: string;
  description?: string;
  features: string[];
  specs: Array<[string, string]>;
  warranty?: string;
  power?: string;
  unit?: string;
  origin?: string;
  segment?: string;
  package?: PackageContent;
}

export interface PackageComponent {
  id: string;
  name: string;
  type: string;
  brand?: string;
  quantity: number;
  unit?: string;
  image?: string;
}

export interface PackageContent {
  components: PackageComponent[];
  systemInfo: Array<[string, string]>;
  warranties: Array<[string, string]>;
}

const TYPE_LABELS: Record<string, string> = {
  SOLAR_PANEL: 'Solar Panel',
  INVERTER: 'Inverter',
  BATTERY: 'Battery',
  STRUCTURE: 'Mounting Structure',
  CABLE_ACCESSORY: 'Cable & Accessory',
  COMPLETE_PACKAGE: 'Solar Package',
};

export function productTypeLabel(type?: ProductType | string): string {
  if (!type) return 'Product';
  return TYPE_LABELS[type] ?? humanize(type.toLowerCase());
}

const text = (v: unknown): string | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t : undefined;
};

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function humanize(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&ndash;': '–',
  '&mdash;': '—',
};

/** Rich-text editor HTML → readable plain text with bullets and paragraphs. */
export function htmlToText(html?: string): string | undefined {
  if (!html) return undefined;
  const out = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\/\s*(p|div|h[1-6]|li|ul|ol|blockquote)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? (m.startsWith('&#') ? String.fromCharCode(parseInt(m.slice(2), 10) || 32) : m))
    .replace(/[ \t\u00a0]{2,}/g, ' ')
    .replace(/[ \t\u00a0]+\n/g, '\n')
    .replace(/\n[ \t\u00a0]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return out || undefined;
}

function formatWarrantyMonths(months?: number | null): string | undefined {
  if (!months || months <= 0) return undefined;
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'Year' : 'Years'}`;
  }
  return `${months} Months`;
}

/** Admin stores warranty as free text; a bare number means years. */
function formatWarrantyText(value?: string): string | undefined {
  if (!value) return undefined;
  if (!/^\d+(\.\d+)?$/.test(value)) return value;
  const n = Number(value);
  if (n <= 0) return undefined;
  return `${n} ${n === 1 ? 'Year' : 'Years'}`;
}

function pairsFromList(list: unknown): Array<[string, string]> {
  if (!Array.isArray(list)) return [];
  return list
    .map((row) => {
      const r = asRecord(row);
      const key = text(r.key) ?? text(r.label) ?? text(r.name);
      const value = text(r.value);
      return key && value ? ([key, value] as [string, string]) : null;
    })
    .filter((p): p is [string, string] => p !== null);
}

function stringsFromList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => (typeof item === 'string' ? text(item) : text(asRecord(item).value) ?? text(asRecord(item).text)))
    .filter((s): s is string => Boolean(s));
}

const LEGACY_SKIP = new Set(['ui', 'description', 'features', 'highlights']);

export function getProductContent(product: Product | null | undefined): ProductContent {
  if (!product) return { typeLabel: 'Product', tags: [], features: [], specs: [] };

  const specs = asRecord(product.specifications);
  const ui = asRecord(specs.ui);

  const legacyPairs: Array<[string, string]> = Object.entries(specs)
    .filter(([key, value]) => !LEGACY_SKIP.has(key) && (typeof value === 'string' || typeof value === 'number'))
    .map(([key, value]) => [humanize(key), String(value).trim()] as [string, string])
    .filter(([, value]) => Boolean(value));

  const specList = [...pairsFromList(ui.specList), ...legacyPairs];
  const features = [...stringsFromList(ui.features), ...stringsFromList(specs.features), ...stringsFromList(specs.highlights)];

  const warranty = formatWarrantyText(text(ui.warranty)) ?? formatWarrantyMonths(product.warrantyMonths);
  const wattage = Number(product.wattageRating);
  const power =
    (Number.isFinite(wattage) && wattage > 0 ? `${wattage} W` : undefined) ??
    specList.find(([k]) => /power|capacity|wattage|output/i.test(k))?.[1] ??
    stringsFromList(ui.tags).find((t) => /^\d+(\.\d+)?\s*(w|kw|kwp)$/i.test(t));

  const category = text(ui.category);
  const subCategory = text(ui.subCategory);
  const unit = text(ui.unit);
  const origin = text(ui.countryOfOrigin);

  const general: Array<[string, string | undefined]> = [
    ['Brand', text(product.brand)],
    ['Model Number', text(product.modelNumber)],
    ['Product Type', productTypeLabel(product.type)],
    ['Category', [category, subCategory].filter(Boolean).join(' › ') || undefined],
    ['Power Rating', Number.isFinite(wattage) && wattage > 0 ? `${wattage} W` : undefined],
    ['Warranty', warranty],
    ['Country of Origin', origin],
    ['Sold As', unit],
    ['SKU', text(product.sku)],
  ];
  const seen = new Set(specList.map(([k]) => k.toLowerCase()));
  const allSpecs: Array<[string, string]> = [
    ...specList,
    ...general.filter((row): row is [string, string] => Boolean(row[1]) && !seen.has(row[0].toLowerCase())),
  ];

  const rawShort = text(ui.shortDescription);
  const shortDescription = rawShort && rawShort.toLowerCase() !== product.name.trim().toLowerCase() ? rawShort : undefined;
  const longDescription = htmlToText(text(ui.longDescription)) ?? text(specs.description);

  const content: ProductContent = {
    typeLabel: productTypeLabel(product.type),
    category,
    subCategory,
    tags: stringsFromList(ui.tags),
    badge: text(ui.badge),
    shortDescription,
    description: longDescription && longDescription !== shortDescription ? longDescription : undefined,
    features: Array.from(new Set(features)),
    specs: allSpecs,
    warranty,
    power,
    unit,
    origin,
    segment: text(ui.targetCustomerSegment),
  };

  if (product.type === 'COMPLETE_PACKAGE' || Array.isArray(product.packageParents) && product.packageParents.length) {
    content.package = getPackageContent(product, ui);
  }
  return content;
}

function getPackageContent(product: Product, ui: Record<string, unknown>): PackageContent {
  const meta = asRecord(ui.componentMeta);
  const components = (Array.isArray(product.packageParents) ? product.packageParents : [])
    .map((row): PackageComponent | null => {
      const r = asRecord(row);
      const c = asRecord(r.componentProduct);
      const id = text(c.id) ?? text(r.componentProductId);
      if (!id) return null;
      const quantity = Number(r.quantity);
      const images = Array.isArray(c.images) ? (c.images as unknown[]) : [];
      return {
        id,
        name: text(c.name) ?? 'Component',
        type: productTypeLabel(text(c.type) ?? text(asRecord(meta[id]).category)),
        brand: text(c.brand),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unit: text(asRecord(meta[id]).unit),
        image: typeof images[0] === 'string' ? (images[0] as string) : undefined,
      };
    })
    .filter((c): c is PackageComponent => c !== null);

  const info = asRecord(ui.systemInfo);
  const systemInfo: Array<[string, string | undefined]> = [
    ['Energy Generation', text(info.generation)],
    ['Estimated Savings', text(info.savings)],
    ['Payback Period', text(info.payback)],
    ['Roof Area Needed', text(info.roofArea)],
  ];
  const w = asRecord(ui.warranties);
  const warranties: Array<[string, string | undefined]> = [
    ['Solar Panels', formatWarrantyText(text(w.panel))],
    ['Inverter', formatWarrantyText(text(w.inverter))],
    ['Installation', formatWarrantyText(text(w.installation))],
  ];

  return {
    components,
    systemInfo: systemInfo.filter((r): r is [string, string] => Boolean(r[1])),
    warranties: warranties.filter((r): r is [string, string] => Boolean(r[1])),
  };
}
