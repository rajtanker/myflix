import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
const INDEX_FILE = path.join(process.cwd(), 'public', 'db.json');

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
  id: m.id,
  tmdb: m.tmdb,
  type: m.type,
  title: m.title,
  slug: m.slug,
  year: m.year,
  releaseDate: m.releaseDate || '',
  poster: m.poster,
  rating: m.rating || 0,
  lang: m.lang || 'en',
  genres: m.genres || [],
  popularity: m.popularity || 0,
}));

fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
fs.writeFileSync(INDEX_FILE, JSON.stringify(slimIndex));
console.log(`Synced public/db.json (${slimIndex.length} titles).`);
