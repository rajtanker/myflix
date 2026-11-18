jsx
'use client';
import { useEffect, useState } from 'react';

export default function SafeImage({
  src,
  fallback = '/noposter.svg',
  alt = '',
  className = '',
  loading = 'lazy',
}) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
