const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  'alphonso-mangoes': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=900&q=80',
  'red-apples': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=900&q=80',
  'organic-tomatoes': 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=900&q=80',
  'red-onions': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=900&q=80',
  'fresh-carrots': 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=900&q=80',
  'amul-toned-milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=900&q=80',
  'farm-fresh-eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=900&q=80',
  'amul-paneer-block': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=80',
  'aged-basmati-rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&q=80',
  'sona-masoori-rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=900&q=80',
  'whole-wheat-atta': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&q=80',
  'dark-chocolate-70': 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=900&q=80',
  'crispy-potato-chips': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=900&q=80',
  'marie-gold-biscuits': 'https://images.unsplash.com/photo-1582053433976-25c00369fc93?w=900&q=80',
  'haldiram-aloo-bhujia': 'https://images.unsplash.com/photo-1604908176997-431c3a7d36a7?w=900&q=80',
  'cold-pressed-oj': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=900&q=80',
  'premium-green-tea': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=900&q=80',
};

const CATEGORY_EMOJIS: Array<[string, string]> = [
  ['tomato', '🍅'],
  ['onion', '🧅'],
  ['milk', '🥛'],
  ['rice', '🌾'],
  ['snack', '🍿'],
  ['fruit', '🍎'],
  ['vegetable', '🥦'],
  ['dairy', '🥛'],
  ['bread', '🍞'],
  ['tea', '🍵'],
  ['coffee', '☕'],
  ['juice', '🧃'],
  ['oil', '🫒'],
  ['egg', '🥚'],
  ['baby', '🍼'],
  ['pet', '🐾'],
];

function normalize(value?: string | null): string {
  return value?.trim() ?? '';
}

function keywordBlob(name: string, slug?: string, categoryName?: string): string {
  return `${name} ${slug ?? ''} ${categoryName ?? ''}`.toLowerCase();
}

export function getCanonicalProductImage(name: string, slug?: string, categoryName?: string, images?: string[]): string {
  const cleanSlug = normalize(slug);
  if (cleanSlug && PRODUCT_IMAGE_OVERRIDES[cleanSlug]) return PRODUCT_IMAGE_OVERRIDES[cleanSlug];

  const firstImage = images?.find((image) => normalize(image));
  if (firstImage) return firstImage;

  return getProductPlaceholderDataUri(name, slug, categoryName);
}

export function getProductPlaceholderDataUri(name: string, slug?: string, categoryName?: string): string {
  const blob = keywordBlob(name, slug, categoryName);
  const emoji = CATEGORY_EMOJIS.find(([key]) => blob.includes(key))?.[1] ?? '🛒';
  const label = name.length > 24 ? `${name.slice(0, 24)}...` : name;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><rect width="640" height="640" rx="48" fill="#F4FBF5"/><rect x="32" y="32" width="576" height="576" rx="40" fill="#E6F7EA" stroke="#CDEED5"/><text x="320" y="240" text-anchor="middle" font-size="120">${emoji}</text><text x="320" y="332" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#129246">VEGU</text><text x="320" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#355B41">${label.replace(/&/g, '&amp;')}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
