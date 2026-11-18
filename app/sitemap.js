js
import { all } from '@/lib/data';
import { SITE } from '@/lib/config';
import { GENRES, LANGS } from '@/lib/constants';

export const dynamic = 'force-static';

export default function sitemap() {
  const base = SITE.url.replace(/\/$/, '');
  const staticPages = [
    '',
    '/movies/',
    '/tv-shows/',
    '/browse/',
    '/watchlist/',
    '/about/',
    '/dmca/',
    '/privacy/',
    '/contact/',
  ];
  const genrePages = GENRES.map((g) => `/genre/${g.slug}/`);
  const langPages = LANGS.map((l) => `/language/${l.slug}/`);
  const itemPages = all().map((m) => (m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`));

  const now = new Date();
  return [...staticPages, ...genrePages, ...langPages, ...itemPages].map((p) => ({
    url: base + (p === '' ? '/' : p),
    lastModified: now,
    priority: p === '' ? 1.0 : 0.7,
  }));
}
