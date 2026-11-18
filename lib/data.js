import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'movies.json');

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
  return all()
    .filter((m) => (!type || m.type === type) && m.releaseDate)
    .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
    .slice(0, n);
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
