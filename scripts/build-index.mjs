import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
const SHORTS_FILE = path.join(process.cwd(), 'data', 'shorts.json');
const INDEX_FILE = path.join(process.cwd(), 'public', 'db.json');
const CLIPS_FILE = path.join(process.cwd(), 'public', 'clips.json');

let items = [];
try {
  items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(items)) items = [];
} catch {
  items = [];
}

if (items.length === 0 && process.env.TMDB_API_KEY) {
  console.log('Catalog empty & TMDB_API_KEY detected — running initial sync...');
  execSync('node scripts/update.mjs', { stdio: 'inherit' });
  items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

const slimIndex = items.map((m) => ({
  id: m.id, tmdb: m.tmdb, type: m.type, title: m.title, slug: m.slug, year: m.year,
  releaseDate: m.releaseDate || '', poster: m.poster, backdrop: m.backdrop || '',
  overview: (m.overview || '').slice(0, 260), rating: m.rating || 0, runtime: m.runtime || 0,
  seasons: m.seasons || 0, trailer: m.trailer || '', director: m.director || '',
  cast: (m.cast || []).slice(0, 6), lang: m.lang || 'en', genres: m.genres || [],
  popularity: m.popularity || 0,
}));

const clipsMap = new Map();
try {
  const savedShorts = JSON.parse(fs.readFileSync(SHORTS_FILE, 'utf8'));
  if (Array.isArray(savedShorts)) {
    for (const c of savedShorts) {
      if (c?.key) clipsMap.set(c.key, c);
    }
  }
} catch {}

for (const m of items) {
  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  const sourceClips = m.clips?.length ? m.clips : (m.trailer ? [{ key: m.trailer, name: 'Official Trailer', type: 'Trailer' }] : []);
  for (const c of sourceClips) {
    if (c?.key && !clipsMap.has(c.key)) {
      clipsMap.set(c.key, {
        id: `${m.id}-${c.key}`,
        key: c.key,
        title: m.title,
        clipName: c.name,
        clipType: c.type,
        views: Math.round((m.popularity || 50) * 15000),
        published: m.releaseDate || '',
        href,
      });
    }
  }
}

const mergedClips = Array.from(clipsMap.values()).slice(0, 800);

fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
fs.writeFileSync(INDEX_FILE, JSON.stringify(slimIndex));
fs.writeFileSync(CLIPS_FILE, JSON.stringify(mergedClips));

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://myflix-7uh.pages.dev').replace(/\/$/, '');
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const rssItems = items
  .filter((m) => m.poster || m.backdrop)
  .slice(0, 15)
  .map((m) => {
    const link = `${SITE_URL}/${m.type === 'tv' ? 'tv' : 'movie'}/${m.slug}/`;
    const img = m.poster || m.backdrop;
    const genres = (m.genres || []).slice(0, 3).map((g) => `#${g.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
    const ratingStr = m.rating > 0 ? `★ ${Number(m.rating).toFixed(1)}` : 'Trending';
    const rawTitle = `${m.title} (${m.year}) • ${ratingStr}`;
    const postTitle = rawTitle.length > 95 ? rawTitle.slice(0, 92) + '...' : rawTitle;
    const postDesc = `${(m.overview || 'Discover trailer, cast, reviews & streaming guide.').slice(0, 240)}... ${genres} #Movies #Cinema #MustWatch`;
    const pubDate = new Date(m.added || Date.now()).toUTCString();

    return `<item><title>${esc(postTitle)}</title><link>${esc(link)}</link><guid isPermaLink="true">${esc(link)}</guid><pubDate>${esc(pubDate)}</pubDate><enclosure url="${esc(img)}" length="0" type="image/jpeg"/><media:content url="${esc(img)}" medium="image"/><description>${esc(postDesc)}</description></item>`;
  }).join('');

const rssXml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>MyFlix — Trending Movies, Series &amp; Anime</title><link>${esc(SITE_URL)}</link><description>Daily trending movies, TV shows, ratings, trailers &amp; quizzes.</description>${rssItems}</channel></rss>`;
fs.writeFileSync(path.join(process.cwd(), 'public', 'feed.xml'), rssXml);

console.log(`Synced public/db.json (${slimIndex.length} titles) & public/clips.json (${mergedClips.length} shorts).`);
