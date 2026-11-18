js
import fs from 'fs';
import path from 'path';
import { TMDB_GENRE_MAP } from '../lib/constants.js';

const KEY = process.env.TMDB_API_KEY;
if (!KEY) {
  console.error('Error: TMDB_API_KEY environment variable is missing.');
  process.exit(1);
}

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
const INDEX_FILE = path.join(process.cwd(), 'public', 'db.json');
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const BGD = 'https://image.tmdb.org/t/p/w1280';
const MAX_ITEMS = 1200;

let existing = [];
try {
  existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(existing)) existing = [];
} catch {
  existing = [];
}

const map = new Map();
for (const m of existing) {
  const uid = m.id && String(m.id).includes('-') ? m.id : `${m.type || 'movie'}-${m.tmdb || m.id}`;
  m.id = uid;
  m.trendingRank = null;
  map.set(uid, m);
}

const slugify = (title, year, tmdbId) => {
  const base = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${base || 'title'}-${year || 'x'}-${tmdbId}`;
};

const mapGenres = (ids = []) => {
  const names = ids.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean);
  return [...new Set(names)];
};

async function get(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url);
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 1500));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      if (i === retries) return null;
      await new Promise((res) => setTimeout(res, 600));
    }
  }
  return null;
}

let trendingCursor = 1;
let addedCursor = 0;
const now = Date.now();

async function grab(endpoint, type, extra = {}, isTrending = false) {
  const p = new URLSearchParams({
    api_key: KEY,
    language: 'en-US',
    include_adult: 'false',
    ...extra,
  });
  const data = await get(`${BASE}${endpoint}?${p.toString()}`);
  if (!data?.results) return;

  for (const r of data.results) {
    const title = r.title || r.name;
    if (!r.id || r.adult || !title || !r.poster_path) continue;

    const uid = `${type}-${r.id}`;
    const releaseDate = r.release_date || r.first_air_date || '';
    const year = releaseDate.slice(0, 4) || '—';
    const genres = mapGenres(r.genre_ids || []);

    if (map.has(uid)) {
      const prev = map.get(uid);
      prev.rating = r.vote_average || prev.rating || 0;
      prev.voteCount = r.vote_count || prev.voteCount || 0;
      prev.popularity = r.popularity || prev.popularity || 0;
      if (r.poster_path) prev.poster = IMG + r.poster_path;
      if (r.backdrop_path) prev.backdrop = BGD + r.backdrop_path;
      if (r.overview) prev.overview = r.overview;
      if (genres.length && !prev.enriched) prev.genres = genres;
      if (isTrending && prev.trendingRank === null) {
        prev.trendingRank = trendingCursor++;
      }
      continue;
    }

    map.set(uid, {
      id: uid,
      tmdb: r.id,
      type,
      title,
      slug: slugify(title, year, r.id),
      year,
      releaseDate,
      poster: IMG + r.poster_path,
      backdrop: r.backdrop_path ? BGD + r.backdrop_path : '',
      overview: r.overview || 'No synopsis available.',
      rating: r.vote_average || 0,
      voteCount: r.vote_count || 0,
      popularity: r.popularity || 0,
      lang: r.original_language || 'en',
      genres,
      runtime: 0,
      director: '',
      tagline: '',
      trailer: '',
      imdb: '',
      cast: [],
      seasons: type === 'tv' ? 1 : 0,
      seasonList: [],
      trendingRank: isTrending ? trendingCursor++ : null,
      enriched: false,
      added: now - addedCursor++,
    });
  }
}

const today = new Date().toISOString().slice(0, 10);

console.log('Fetching trending & popular titles from TMDB...');
await grab('/trending/movie/week', 'movie', { page: '1' }, true);
await grab('/trending/tv/week', 'tv', { page: '1' }, true);
await grab('/trending/movie/week', 'movie', { page: '2' }, true);
await grab('/trending/tv/week', 'tv', { page: '2' }, true);

await grab('/movie/now_playing', 'movie', { page: '1' });
await grab('/movie/now_playing', 'movie', { page: '2' });
await grab('/movie/popular', 'movie', { page: '1' });
await grab('/movie/popular', 'movie', { page: '2' });
await grab('/movie/top_rated', 'movie', { page: '1' });

await grab('/tv/popular', 'tv', { page: '1' });
await grab('/tv/popular', 'tv', { page: '2' });
await grab('/tv/top_rated', 'tv', { page: '1' });

await grab('/discover/movie', 'movie', {
  sort_by: 'primary_release_date.desc',
  'primary_release_date.lte': today,
  'vote_count.gte': '20',
  page: '1',
});

for (const l of ['hi', 'ko', 'ja', 'es', 'fr', 'bn', 'ta', 'te', 'ml', 'kn']) {
  await grab('/discover/movie', 'movie', {
    sort_by: 'popularity.desc',
    with_original_language: l,
    'vote_count.gte': '10',
    page: '1',
  });
}

for (const l of ['ko', 'ja', 'hi', 'es']) {
  await grab('/discover/tv', 'tv', {
    sort_by: 'popularity.desc',
    with_original_language: l,
    'vote_count.gte': '10',
    page: '1',
  });
}

// Enrich up to 240 un-enriched items in batches of 8
const toEnrich = Array.from(map.values())
  .filter((x) => !x.enriched)
  .sort((a, b) => (a.trendingRank ?? 999999) - (b.trendingRank ?? 999999) || (b.popularity || 0) - (a.popularity || 0))
  .slice(0, 240);

console.log(`Enriching ${toEnrich.length} titles with cast, trailers, runtime & seasons...`);

async function enrichOne(m) {
  const endpoint = m.type === 'tv' ? 'tv' : 'movie';
  const d = await get(
    `${BASE}/${endpoint}/${m.tmdb}?api_key=${KEY}&language=en-US&append_to_response=credits,videos,external_ids`
  );
  if (!d) return;

  const detailGenres = mapGenres((d.genres || []).map((g) => g.id));
  if (detailGenres.length) m.genres = detailGenres;

  m.tagline = d.tagline || '';
  m.imdb = d.external_ids?.imdb_id || d.imdb_id || '';
  m.cast = (d.credits?.cast || []).slice(0, 8).map((c) => c.name).filter(Boolean);

  if (m.type === 'movie') {
    m.runtime = d.runtime || 0;
    m.director = (d.credits?.crew || []).find((c) => c.job === 'Director')?.name || '';
  } else {
    m.runtime = d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || 0;
    m.director = (d.created_by || []).map((c) => c.name).slice(0, 2).join(', ');
    const validSeasons = (d.seasons || [])
      .filter((s) => s.season_number >= 1 && s.episode_count > 0)
      .sort((a, b) => a.season_number - b.season_number)
      .slice(0, 25);
    m.seasonList = validSeasons.map((s) => ({
      s: s.season_number,
      eps: Math.min(s.episode_count, 200),
    }));
    m.seasons = d.number_of_seasons || m.seasonList.length || 1;
  }

  const vids = d.videos?.results || [];
  const ytTrailer =
    vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    vids.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
  m.trailer = ytTrailer?.key || '';
  m.enriched = true;
}

for (let i = 0; i < toEnrich.length; i += 8) {
  await Promise.all(toEnrich.slice(i, i + 8).map(enrichOne));
  await new Promise((res) => setTimeout(res, 120));
}

// Sort: trending first, then highest popularity
const finalList = Array.from(map.values())
  .sort((a, b) => {
    const aT = typeof a.trendingRank === 'number' ? a.trendingRank : 999999;
    const bT = typeof b.trendingRank === 'number' ? b.trendingRank : 999999;
    if (aT !== bT) return aT - bT;
    return (b.popularity || 0) - (a.popularity || 0);
  })
  .slice(0, MAX_ITEMS);

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });

fs.writeFileSync(DATA_FILE, JSON.stringify(finalList));

const slimIndex = finalList.map((m) => ({
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
fs.writeFileSync(INDEX_FILE, JSON.stringify(slimIndex));

console.log(`Done! Saved ${finalList.length} titles to data/movies.json & public/db.json.`);
