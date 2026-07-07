'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getCanonicalProductImage, getProductPlaceholderDataUri } from '@/lib/productImage';

type ProductImageProps = {
  name: string;
  slug?: string;
  categoryName?: string;
  images?: string[];
  alt?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
};

export default function ProductImage({
  name,
  slug,
  categoryName,
  images,
  alt,
  className,
  sizes,
  fill,
  width,
  height,
  priority,
}: ProductImageProps) {
  const primarySrc = useMemo(
    () => getCanonicalProductImage(name, slug, categoryName, images),
    [categoryName, images, name, slug]
  );
  const fallbackSrc = useMemo(
    () => getProductPlaceholderDataUri(name, slug, categoryName),
    [categoryName, name, slug]
  );
  const [src, setSrc] = useState(primarySrc);

  useEffect(() => {
    setSrc(primarySrc);
  }, [primarySrc]);

  return (
    <Image
      src={src}
      alt={alt ?? name}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      className={className}
      unoptimized={src.startsWith('data:')}
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc);
      }}
    />
  );
}
