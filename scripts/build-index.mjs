import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
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

const clipsList = [];
for (const m of items) {
  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  const sourceClips = m.clips?.length ? m.clips : (m.trailer ? [{ key: m.trailer, name: 'Official Trailer', type: 'Trailer' }] : []);
  for (const c of sourceClips) {
    clipsList.push({ id: `${m.id}-${c.key}`, key: c.key, title: m.title, clipName: c.name, clipType: c.type, href });
  }
  if (clipsList.length >= 120) break;
}

fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
fs.writeFileSync(INDEX_FILE, JSON.stringify(slimIndex));
fs.writeFileSync(CLIPS_FILE, JSON.stringify(clipsList));
console.log(`Synced public/db.json (${slimIndex.length} titles) & public/clips.json (${clipsList.length} clips).`);
