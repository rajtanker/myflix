import fs from 'fs';
import path from 'path';

const TMDB_KEY = process.env.TMDB_API_KEY || '';
const YT_KEY = process.env.YOUTUBE_API_KEY || '';

const SHORTS_DATA = path.join(process.cwd(), 'data', 'shorts.json');
const MOVIES_DATA = path.join(process.cwd(), 'data', 'movies.json');
const CLIPS_PUBLIC = path.join(process.cwd(), 'public', 'clips.json');
const MAX_SHORTS = 800;

const YT_CHANNELS = [
  { handle: '@Movieclips', id: 'UC3gNmTGu-TTbFPpfSs5kNkg', cat: 'Clip', label: 'Movieclips' },
  { handle: '@RottenTomatoesTRAILERS', id: 'UCi8e0iOVk1fEOogdfu4YgfA', cat: 'Trailer', label: 'RT Trailers' },
  { handle: '@Netflix', id: 'UCWOA1ZGywLbqmigxE4Qlvuw', cat: 'Clip', label: 'Netflix' },
  { handle: '@Marvel', id: 'UCvC4D8onUfXzvjTOM-dBfEA', cat: 'Clip', label: 'Marvel' },
  { handle: '@WarnerBrosPictures', id: 'UCjmJDM5pRKbUlVIzDYYWb6g', cat: 'Trailer', label: 'Warner Bros' },
  { handle: '@SonyPictures', id: 'UCz97F7dMxBNOfGYu3rx8aCw', cat: 'Trailer', label: 'Sony Pictures' },
  { handle: '@UniversalPictures', id: 'UCq0OueAsdxH6b8nyAspwViw', cat: 'Trailer', label: 'Universal' },
  { handle: '@ParamountPictures', id: 'UCF9imwPMSGz4Vq1NiTWCC7g', cat: 'Trailer', label: 'Paramount' },
  { handle: '@A24', id: 'UCuPivVjnfNo4mb3Oog_frZg', cat: 'Clip', label: 'A24' },
  { handle: '@Crunchyroll', id: 'UC6pGDc4bFGD1_36IKv3FnYg', cat: 'Anime', label: 'Crunchyroll' },
  { handle: '@PrimeVideo', id: '', cat: 'Clip', label: 'Prime Video' },
  { handle: '@YRF', id: '', cat: 'Clip', label: 'YRF' },
];

const decodeXml = (s = '') =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

function classifyClip(title = '', defaultCat = 'Clip') {
  const t = title.toLowerCase();
  if (t.includes('anime') || t.includes('crunchyroll') || defaultCat === 'Anime') return 'Anime';
  if (t.includes('funny') || t.includes('blooper') || t.includes('gag') || t.includes('comedy') || t.includes('laugh')) return 'Funny';
  if (t.includes('trailer') || t.includes('teaser')) return 'Trailer';
  return defaultCat || 'Clip';
}

async function fetchJson(url) {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function resolveChannelId(handle) {
  try {
    const r = await fetch(`https://www.youtube.com/${handle}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!r.ok) return null;
    const html = await r.text();
    const m =
      html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/) ||
      html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
      html.match(/channel_id=(UC[a-zA-Z0-9_-]{22})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchChannelRss(ch) {
  let cid = ch.id;
  if (!cid && ch.handle) cid = await resolveChannelId(ch.handle);
  if (!cid) return [];

  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`);
    if (!r.ok) return [];
    const xml = await r.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    const out = [];

    for (const entry of entries) {
      const vid = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const rawTitle = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || '';
      const views = Number(entry.match(/views="(\d+)"/)?.[1] || 0);
      if (!vid || !rawTitle) continue;
      if (views < 2500) continue; // Only quality / popular videos

      const title = decodeXml(rawTitle).trim();
      const cat = classifyClip(title, ch.cat);
      out.push({
        id: `yt-${vid}`,
        key: vid,
        title,
        clipName: ch.label,
        clipType: cat,
        views,
        published: published.slice(0, 10),
        href: `/browse/?q=${encodeURIComponent(title.split(/[-|:(]/)[0].trim().slice(0, 40))}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchYouTubeApiShorts() {
  if (!YT_KEY) return [];
  const queries = [
    'best movie scenes clips #shorts',
    'funny movie moments #shorts',
    'anime epic scenes #shorts',
  ];
  const out = [];
  for (const q of queries) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&order=viewCount&maxResults=20&q=${encodeURIComponent(q)}&key=${YT_KEY}`;
    const data = await fetchJson(url);
    if (!data?.items) continue;
    for (const item of data.items) {
      const vid = item.id?.videoId;
      const title = item.snippet?.title;
      if (!vid || !title) continue;
      out.push({
        id: `yt-${vid}`,
        key: vid,
        title: decodeXml(title),
        clipName: item.snippet?.channelTitle || 'YouTube Shorts',
        clipType: classifyClip(title, 'Clip'),
        views: 500000,
        published: (item.snippet?.publishedAt || '').slice(0, 10),
        href: '/browse/',
      });
    }
  }
  return out;
}

const map = new Map();

// 1. Keep previous quality shorts
try {
  const prev = JSON.parse(fs.readFileSync(SHORTS_DATA, 'utf8'));
  if (Array.isArray(prev)) {
    for (const c of prev) {
      if (c?.key) map.set(c.key, c);
    }
  }
} catch {}

// 2. Pull fresh official YouTube Channel RSS clips (with real view counts!)
console.log('Fetching high-view clips from official YouTube channels...');
for (const ch of YT_CHANNELS) {
  const list = await fetchChannelRss(ch);
  for (const c of list) {
    map.set(c.key, c);
  }
}

// 3. Optional YouTube Data API v3 viral #shorts if key exists
const apiShorts = await fetchYouTubeApiShorts();
for (const c of apiShorts) map.set(c.key, c);

// 4. Pull rich clips from local movies.json + fresh TMDB trending
let movies = [];
try {
  movies = JSON.parse(fs.readFileSync(MOVIES_DATA, 'utf8'));
  if (!Array.isArray(movies)) movies = [];
} catch {
  movies = [];
}

for (const m of movies) {
  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  const estViews = Math.round((m.popularity || 50) * 18000);
  const vids = m.clips?.length
    ? m.clips
    : m.trailer
    ? [{ key: m.trailer, name: 'Official Trailer', type: 'Trailer' }]
    : [];
  for (const v of vids) {
    if (!v?.key) continue;
    const cat = m.lang === 'ja' && (m.genres || []).includes('Animation')
      ? 'Anime'
      : classifyClip(v.name, v.type === 'Bloopers' ? 'Funny' : v.type);
    map.set(v.key, {
      id: `tmdb-${v.key}`,
      key: v.key,
      title: m.title,
      clipName: v.name || 'Movie Clip',
      clipType: cat,
      views: Math.max(estViews, 25000),
      published: m.releaseDate || String(m.year || ''),
      href,
    });
  }
}

// Also fetch fresh TMDB daily trending clips if TMDB_API_KEY is present
if (TMDB_KEY) {
  const tr = await fetchJson(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}`);
  for (const r of (tr?.results || []).slice(0, 15)) {
    const type = r.media_type === 'tv' ? 'tv' : 'movie';
    const vdata = await fetchJson(`https://api.themoviedb.org/3/${type}/${r.id}/videos?api_key=${TMDB_KEY}`);
    const ytVids = (vdata?.results || []).filter((v) => v.site === 'YouTube' && v.key).slice(0, 2);
    const title = r.title || r.name;
    for (const v of ytVids) {
      if (!map.has(v.key) && title) {
        map.set(v.key, {
          id: `tmdb-${v.key}`,
          key: v.key,
          title,
          clipName: v.name || 'Trending Clip',
          clipType: classifyClip(v.name, v.type === 'Trailer' ? 'Trailer' : 'Clip'),
          views: Math.round((r.popularity || 100) * 20000),
          published: r.release_date || r.first_air_date || '',
          href: `/browse/?q=${encodeURIComponent(title)}`,
        });
      }
    }
  }
}

// Score by high views + freshness
const nowMs = Date.now();
const scored = Array.from(map.values())
  .map((c) => {
    const pubMs = Date.parse(c.published || '') || nowMs - 90 * 86400000;
    const daysOld = Math.max(1, (nowMs - pubMs) / 86400000);
    const viewScore = Math.log10(Math.max(c.views || 1000, 1000));
    const freshScore = 10 / Math.sqrt(daysOld);
    return { clip: c, score: viewScore * 2 + freshScore };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, MAX_SHORTS)
  .map((x) => x.clip);

fs.mkdirSync(path.dirname(SHORTS_DATA), { recursive: true });
fs.mkdirSync(path.dirname(CLIPS_PUBLIC), { recursive: true });
fs.writeFileSync(SHORTS_DATA, JSON.stringify(scored));
fs.writeFileSync(CLIPS_PUBLIC, JSON.stringify(scored));

console.log(`Saved ${scored.length} high-view quality shorts to data/shorts.json & public/clips.json!`);
