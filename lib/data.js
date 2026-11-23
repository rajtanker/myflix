import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'movies.json');
const NEWS_FILE = path.join(process.cwd(), 'data', 'news.json');

let cache = null;

export function all() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    cache = Array.isArray(parsed) ? parsed : [];
    return cache;
  } catch {
    return [];
  }
}

export function bySlug(slug, type) {
  return all().find((m) => m.slug === slug && (!type || m.type === type)) || null;
}

export function byLang(code) {
  return all().filter((m) => m.lang === code);
}

export function byGenre(genreName) {
  const gLower = genreName.toLowerCase();
  return all().filter((m) =>
    (m.genres || []).some((g) => g.toLowerCase() === gLower)
  );
}

export function byType(type) {
  return all().filter((m) => m.type === type);
}

export function trending(n = 15) {
  const items = all();
  const marked = items
    .filter((m) => typeof m.trendingRank === 'number')
    .sort((a, b) => a.trendingRank - b.trendingRank);
  if (marked.length >= n) return marked.slice(0, n);
  const seen = new Set(marked.map((x) => x.id));
  const rest = items.filter((x) => !seen.has(x.id));
  return [...marked, ...rest].slice(0, n);
}

export function newest(n = 24, type = null) {
  const today = new Date().toISOString().slice(0, 10);
  return all()
    .filter((m) => (!type || m.type === type) && m.releaseDate && m.releaseDate <= today)
    .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
    .slice(0, n);
}

export function upcoming(n = 24) {
  const today = new Date().toISOString().slice(0, 10);
  const marked = all().filter(
    (m) => m.upcoming === true || (m.releaseDate && m.releaseDate > today)
  );
  return marked
    .sort((a, b) => (a.releaseDate || '9999').localeCompare(b.releaseDate || '9999'))
    .slice(0, n);
}

export function anime(n = 36) {
  return all()
    .filter((m) => m.lang === 'ja' && (m.genres || []).includes('Animation'))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, n);
}

export function news(n = 12) {
  try {
    const raw = fs.readFileSync(NEWS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, n);
  } catch {}
  return all().slice(0, 6).map((m) => ({
    id: m.id,
    title: `${m.title} (${m.year}) — Trending Worldwide on MyFlix`,
    summary: (m.overview || '').slice(0, 140),
    date: m.releaseDate || new Date().toISOString().slice(0, 10),
    image: m.backdrop || m.poster,
    href: m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`,
    tag: m.type === 'tv' ? 'Series Buzz' : 'Box Office & Buzz',
  }));
}

export function topRated(n = 18, type = null) {
  return all()
    .filter((m) => (!type || m.type === type) && (m.voteCount || 0) >= 50 && m.rating > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, n);
}

export function related(m, n = 12) {
  const mGenres = new Set(m.genres || []);
  return all()
    .filter((x) => x.id !== m.id)
    .map((x) => {
      const overlap = (x.genres || []).filter((g) => mGenres.has(g)).length;
      const sameType = x.type === m.type ? 1 : 0;
      const sameLang = x.lang === m.lang ? 0.5 : 0;
      return { item: x, score: overlap * 2 + sameType + sameLang };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score || (b.item.popularity || 0) - (a.item.popularity || 0))
    .slice(0, n)
    .map((x) => x.item);
}
