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

export function resolveCanonicalProductImage(slug: string, images?: string[]): string | null {
  if (PRODUCT_IMAGE_OVERRIDES[slug]) return PRODUCT_IMAGE_OVERRIDES[slug];
  return images?.find((image) => image?.trim()) ?? null;
}
