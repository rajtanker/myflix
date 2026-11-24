import fs from 'fs';
import path from 'path';

const KEY = process.env.TMDB_API_KEY;
if (!KEY) {
  console.error('Error: TMDB_API_KEY environment variable is missing.');
  process.exit(1);
}

const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'Drama', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action',
  10762: 'Family', 10763: 'Documentary', 10764: 'Drama', 10765: 'Sci-Fi',
  10766: 'Drama', 10767: 'Comedy', 10768: 'War',
};

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
const NEWS_FILE = path.join(process.cwd(), 'data', 'news.json');
const INDEX_FILE = path.join(process.cwd(), 'public', 'db.json');
const CLIPS_FILE = path.join(process.cwd(), 'public', 'clips.json');
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const BGD = 'https://image.tmdb.org/t/p/w1280';
const MAX_ITEMS = 2600;

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
  const base = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${base || 'title'}-${year || 'x'}-${tmdbId}`;
};

const mapGenres = (ids = []) => [...new Set(ids.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean))];

async function get(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url);
      if (r.status === 429) { await new Promise((res) => setTimeout(res, 1500)); continue; }
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
const today = new Date().toISOString().slice(0, 10);

async function grab(endpoint, type, extra = {}, opts = {}) {
  const p = new URLSearchParams({ api_key: KEY, language: 'en-US', include_adult: 'false', ...extra });
  const data = await get(`${BASE}${endpoint}?${p.toString()}`);
  if (!data?.results) return;

  for (const r of data.results) {
    const title = r.title || r.name;
    if (!r.id || r.adult || !title || !r.poster_path) continue;

    const uid = `${type}-${r.id}`;
    const releaseDate = r.release_date || r.first_air_date || '';
    const year = releaseDate.slice(0, 4) || '—';
    const genres = mapGenres(r.genre_ids || []);
    const isUp = !!opts.upcoming || (releaseDate && releaseDate > today);

    if (map.has(uid)) {
      const prev = map.get(uid);
      prev.rating = r.vote_average || prev.rating || 0;
      prev.voteCount = r.vote_count || prev.voteCount || 0;
      prev.popularity = r.popularity || prev.popularity || 0;
      prev.upcoming = isUp;
      if (r.poster_path) prev.poster = IMG + r.poster_path;
      if (r.backdrop_path) prev.backdrop = BGD + r.backdrop_path;
      if (r.overview) prev.overview = r.overview;
      if (genres.length && !prev.enriched) prev.genres = genres;
      if (opts.trending && prev.trendingRank === null) prev.trendingRank = trendingCursor++;
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
      clips: [],
      reviews: [],
      providers: [],
      imdb: '',
      cast: [],
      seasons: type === 'tv' ? 1 : 0,
      seasonList: [],
      upcoming: isUp,
      trendingRank: opts.trending ? trendingCursor++ : null,
      enriched: false,
      added: now - addedCursor++,
    });
  }
}

console.log('Fetching Trending, Upcoming, Anime & Global Catalog...');
await grab('/trending/movie/week', 'movie', { page: '1' }, { trending: true });
await grab('/trending/tv/week', 'tv', { page: '1' }, { trending: true });
await grab('/trending/movie/week', 'movie', { page: '2' }, { trending: true });
await grab('/trending/tv/week', 'tv', { page: '2' }, { trending: true });

await grab('/movie/upcoming', 'movie', { page: '1', region: 'US' }, { upcoming: true });
await grab('/movie/now_playing', 'movie', { page: '1' });
await grab('/movie/popular', 'movie', { page: '1' });
await grab('/movie/top_rated', 'movie', { page: '1' });
await grab('/tv/popular', 'tv', { page: '1' });
await grab('/tv/on_the_air', 'tv', { page: '1' });
await grab('/tv/top_rated', 'tv', { page: '1' });

// Dedicated Anime Pull
await grab('/discover/tv', 'tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', page: '1' });
await grab('/discover/movie', 'movie', { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', page: '1' });

for (const l of ['hi', 'ko', 'ja', 'es', 'fr', 'bn', 'ta', 'te']) {
  await grab('/discover/movie', 'movie', { sort_by: 'popularity.desc', with_original_language: l, 'vote_count.gte': '10', page: '1' });
}

// Pull Classics & Multi-era Web Series / Movies safely
for (const p of ['2', '3', '4']) {
  await grab('/movie/popular', 'movie', { page: p });
  await grab('/movie/top_rated', 'movie', { page: p });
  await grab('/tv/popular', 'tv', { page: p });
  await grab('/tv/top_rated', 'tv', { page: p });
}
await grab('/discover/movie', 'movie', { sort_by: 'vote_count.desc', 'primary_release_date.lte': '2009-12-31', page: '1' });
await grab('/discover/movie', 'movie', { sort_by: 'vote_count.desc', 'primary_release_date.lte': '1999-12-31', page: '1' });
await grab('/discover/tv', 'tv', { sort_by: 'vote_count.desc', page: '2' });

const toEnrich = Array.from(map.values())
  .filter((x) => !x.enriched || !Array.isArray(x.reviews) || !Array.isArray(x.clips))
  .sort((a, b) => (a.trendingRank ?? 999999) - (b.trendingRank ?? 999999) || (b.popularity || 0) - (a.popularity || 0))
  .slice(0, 220);

console.log(`Enriching ${toEnrich.length} titles with reviews, clips, cast & seasons...`);

async function enrichOne(m) {
  const endpoint = m.type === 'tv' ? 'tv' : 'movie';
  const d = await get(
    `${BASE}/${endpoint}/${m.tmdb}?api_key=${KEY}&language=en-US&append_to_response=credits,videos,reviews,external_ids,watch/providers`
  );
  if (!d) return;

  const detailGenres = mapGenres((d.genres || []).map((g) => g.id));
  if (detailGenres.length) m.genres = detailGenres;

  m.tagline = d.tagline || '';
  m.imdb = d.external_ids?.imdb_id || d.imdb_id || '';
  m.cast = (d.credits?.cast || []).slice(0, 8).map((c) => c.name).filter(Boolean);
  m.providers = (d['watch/providers']?.results?.US?.flatrate || d['watch/providers']?.results?.IN?.flatrate || [])
    .slice(0, 6)
    .map((p) => ({ name: p.provider_name, logo: p.logo_path }));

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
    m.seasonList = validSeasons.map((s) => ({ s: s.season_number, eps: Math.min(s.episode_count, 200) }));
    m.seasons = d.number_of_seasons || m.seasonList.length || 1;
  }

  const vids = (d.videos?.results || []).filter((v) => v.site === 'YouTube' && v.key);
  const ytTrailer =
    vids.find((v) => v.type === 'Trailer' && v.official) ||
    vids.find((v) => v.type === 'Trailer') ||
    vids.find((v) => v.type === 'Teaser');
  m.trailer = ytTrailer?.key || '';
  m.clips = vids
    .filter((v) => ['Clip', 'Featurette', 'Teaser', 'Trailer', 'Bloopers'].includes(v.type))
    .slice(0, 3)
    .map((v) => ({ key: v.key, name: v.name || 'Official Clip', type: v.type }));

  m.reviews = (d.reviews?.results || [])
    .filter((rv) => rv.content)
    .slice(0, 3)
    .map((rv) => ({
      author: rv.author || 'Critic',
      rating: rv.author_details?.rating || 0,
      content: rv.content.replace(/\s+/g, ' ').slice(0, 420) + (rv.content.length > 420 ? '...' : ''),
      createdAt: (rv.created_at || '').slice(0, 10),
    }));

  m.enriched = true;
}

for (let i = 0; i < toEnrich.length; i += 8) {
  await Promise.all(toEnrich.slice(i, i + 8).map(enrichOne));
  await new Promise((res) => setTimeout(res, 120));
}

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
  id: m.id, tmdb: m.tmdb, type: m.type, title: m.title, slug: m.slug, year: m.year,
  releaseDate: m.releaseDate || '', poster: m.poster, backdrop: m.backdrop || '',
  overview: (m.overview || '').slice(0, 260), rating: m.rating || 0, runtime: m.runtime || 0,
  seasons: m.seasons || 0, trailer: m.trailer || '', director: m.director || '',
  cast: (m.cast || []).slice(0, 6), lang: m.lang || 'en', genres: m.genres || [],
  popularity: m.popularity || 0,
}));
fs.writeFileSync(INDEX_FILE, JSON.stringify(slimIndex));

// Build Shorts / Clips feed
const clipsList = [];
for (const m of finalList) {
  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  const sourceClips = m.clips?.length ? m.clips : (m.trailer ? [{ key: m.trailer, name: 'Official Trailer', type: 'Trailer' }] : []);
  for (const c of sourceClips) {
    clipsList.push({ id: `${m.id}-${c.key}`, key: c.key, title: m.title, clipName: c.name, clipType: c.type, href });
  }
  if (clipsList.length >= 120) break;
}
fs.writeFileSync(CLIPS_FILE, JSON.stringify(clipsList));

// Build Daily Cinema News Digest
const newsList = [];
const picks = [
  ...finalList.filter((m) => typeof m.trendingRank === 'number').slice(0, 8),
  ...finalList.filter((m) => m.upcoming).slice(0, 8),
];
const seenNews = new Set();
for (const m of picks) {
  if (seenNews.has(m.id)) continue;
  seenNews.add(m.id);
  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  newsList.push({
    id: m.id,
    title: m.upcoming
      ? `Upcoming Spotlight: "${m.title}" Set for ${m.releaseDate || m.year}`
      : `Trending Worldwide: Why Everyone Is Watching "${m.title}"`,
    summary: (m.overview || '').slice(0, 170),
    date: m.releaseDate || today,
    image: m.backdrop || m.poster,
    href,
    tag: m.upcoming ? 'Release Radar' : (m.type === 'tv' ? 'Series Buzz' : 'Trending Spotlight'),
  });
}
fs.writeFileSync(NEWS_FILE, JSON.stringify(newsList.slice(0, 24)));

console.log(`Synced ${finalList.length} titles, ${clipsList.length} clips, ${newsList.length} news briefs.`);
