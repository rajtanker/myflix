const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const BGD = 'https://image.tmdb.org/t/p/w1280';

const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'Drama', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action',
  10762: 'Family', 10763: 'Documentary', 10764: 'Drama', 10765: 'Sci-Fi',
  10766: 'Drama', 10767: 'Comedy', 10768: 'War',
};

const MOVIE_GENRE_ID = {
  Action: '28', Adventure: '12', Animation: '16', Comedy: '35', Crime: '80',
  Documentary: '99', Drama: '18', Family: '10751', Fantasy: '14', History: '36',
  Horror: '27', Music: '10402', Mystery: '9648', Romance: '10749', 'Sci-Fi': '878',
  Thriller: '53', War: '10752', Western: '37',
};

const TV_GENRE_ID = {
  Action: '10759', Adventure: '10759', Animation: '16', Comedy: '35', Crime: '80',
  Documentary: '99', Drama: '18', Family: '10762', Fantasy: '10765', History: '36',
  Horror: '27', Music: '10402', Mystery: '9648', Romance: '10749', 'Sci-Fi': '10765',
  Thriller: '9648', War: '10768', Western: '37',
};

const mapGenres = (ids = []) => [...new Set(ids.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean))];

function normalizeItem(r, forcedType = null) {
  const type = forcedType || (r.media_type === 'tv' || (!r.title && r.name) ? 'tv' : 'movie');
  const title = r.title || r.name || 'Untitled';
  const releaseDate = r.release_date || r.first_air_date || '';
  return {
    id: `${type}-${r.id}`,
    tmdb: r.id,
    type,
    title,
    slug: '',
    year: releaseDate.slice(0, 4) || '—',
    releaseDate,
    poster: r.poster_path ? IMG + r.poster_path : '',
    backdrop: r.backdrop_path ? BGD + r.backdrop_path : '',
    overview: r.overview || 'No synopsis available.',
    rating: r.vote_average || 0,
    voteCount: r.vote_count || 0,
    popularity: r.popularity || 0,
    lang: r.original_language || 'en',
    genres: mapGenres(r.genre_ids || (r.genres || []).map((g) => g.id)),
    live: true,
  };
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function onRequestGet({ request, env }) {
  const key = env.TMDB_API_KEY;
  if (!key) {
    return jsonRes({ error: 'MISSING_KEY', results: [] }, 200);
  }

  const reqUrl = new URL(request.url);
  const action = reqUrl.searchParams.get('action') || 'search';
  const page = reqUrl.searchParams.get('page') || '1';

  try {
    if (action === 'search') {
      const q = (reqUrl.searchParams.get('q') || '').trim();
      const type = reqUrl.searchParams.get('type') || 'all';
      if (!q) return jsonRes({ results: [], totalPages: 1 });

      const ep = type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
      const p = new URLSearchParams({
        api_key: key,
        language: 'en-US',
        include_adult: 'false',
        query: q,
        page,
      });

      const r = await fetch(`${BASE}${ep}?${p}`);
      const d = await r.json();
      const results = (d.results || [])
        .filter((x) => x.media_type !== 'person' && !x.adult && x.poster_path)
        .map((x) => normalizeItem(x, type === 'all' ? null : type));

      return jsonRes({ results, totalPages: Math.min(d.total_pages || 1, 500) });
    }

    if (action === 'discover') {
      const type = reqUrl.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      const genre = reqUrl.searchParams.get('genre') || 'all';
      const lang = reqUrl.searchParams.get('lang') || 'all';
      const year = reqUrl.searchParams.get('year') || 'all';
      const sort = reqUrl.searchParams.get('sort') || 'popular';

      const sortMap = {
        popular: 'popularity.desc',
        rating: 'vote_average.desc',
        newest: type === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc',
        az: 'original_title.asc',
      };

      const p = new URLSearchParams({
        api_key: key,
        language: 'en-US',
        include_adult: 'false',
        sort_by: sortMap[sort] || 'popularity.desc',
        page,
      });

      if (sort === 'rating') p.set('vote_count.gte', '100');
      if (genre !== 'all') {
        const gid = type === 'tv' ? TV_GENRE_ID[genre] : MOVIE_GENRE_ID[genre];
        if (gid) p.set('with_genres', gid);
      }
      if (lang !== 'all') p.set('with_original_language', lang);

      const dateField = type === 'tv' ? 'first_air_date' : 'primary_release_date';
      if (year === '2026' || year === '2025' || year === '2024') {
        p.set(`${dateField}.gte`, `${year}-01-01`);
        p.set(`${dateField}.lte`, `${year}-12-31`);
      } else if (year === '2020s') {
        p.set(`${dateField}.gte`, '2020-01-01');
      } else if (year === '2010s') {
        p.set(`${dateField}.gte`, '2010-01-01');
        p.set(`${dateField}.lte`, '2019-12-31');
      } else if (year === '2000s') {
        p.set(`${dateField}.gte`, '2000-01-01');
        p.set(`${dateField}.lte`, '2009-12-31');
      } else if (year === '1990s') {
        p.set(`${dateField}.gte`, '1990-01-01');
        p.set(`${dateField}.lte`, '1999-12-31');
      } else if (year === 'classic') {
        p.set(`${dateField}.lte`, '1989-12-31');
      }

      const r = await fetch(`${BASE}/discover/${type}?${p}`);
      const d = await r.json();
      const results = (d.results || [])
        .filter((x) => !x.adult && x.poster_path)
        .map((x) => normalizeItem(x, type));

      return jsonRes({ results, totalPages: Math.min(d.total_pages || 1, 500) });
    }

    if (action === 'detail') {
      const type = reqUrl.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      const id = reqUrl.searchParams.get('id');
      if (!id) return jsonRes({ error: 'MISSING_ID' }, 400);

      const r = await fetch(
        `${BASE}/${type}/${encodeURIComponent(id)}?api_key=${key}&language=en-US&append_to_response=credits,videos,reviews,recommendations,external_ids`
      );
      if (!r.ok) return jsonRes({ error: 'NOT_FOUND' }, 404);
      const d = await r.json();

      const item = normalizeItem(d, type);
      item.tagline = d.tagline || '';
      item.imdb = d.external_ids?.imdb_id || d.imdb_id || '';
      item.cast = (d.credits?.cast || []).slice(0, 8).map((c) => c.name).filter(Boolean);

      if (type === 'movie') {
        item.runtime = d.runtime || 0;
        item.director = (d.credits?.crew || []).find((c) => c.job === 'Director')?.name || '';
      } else {
        item.runtime = d.episode_run_time?.[0] || d.last_episode_to_air?.runtime || 0;
        item.director = (d.created_by || []).map((c) => c.name).slice(0, 2).join(', ');
        const validSeasons = (d.seasons || [])
          .filter((s) => s.season_number >= 1 && s.episode_count > 0)
          .sort((a, b) => a.season_number - b.season_number)
          .slice(0, 25);
        item.seasonList = validSeasons.map((s) => ({
          s: s.season_number,
          eps: Math.min(s.episode_count, 200),
        }));
        item.seasons = d.number_of_seasons || item.seasonList.length || 1;
      }

      const vids = (d.videos?.results || []).filter((v) => v.site === 'YouTube' && v.key);
      const ytTrailer =
        vids.find((v) => v.type === 'Trailer' && v.official) ||
        vids.find((v) => v.type === 'Trailer') ||
        vids.find((v) => v.type === 'Teaser');
      item.trailer = ytTrailer?.key || '';

      item.reviews = (d.reviews?.results || [])
        .filter((rv) => rv.content)
        .slice(0, 4)
        .map((rv) => ({
          author: rv.author || 'Critic',
          rating: rv.author_details?.rating || 0,
          content: rv.content.replace(/\s+/g, ' ').slice(0, 420) + (rv.content.length > 420 ? '...' : ''),
          createdAt: (rv.created_at || '').slice(0, 10),
        }));

      const related = (d.recommendations?.results || [])
        .filter((x) => !x.adult && x.poster_path)
        .slice(0, 12)
        .map((x) => normalizeItem(x, type));

      return jsonRes({ item, related });
    }

    return jsonRes({ error: 'UNKNOWN_ACTION' }, 400);
  } catch {
    return jsonRes({ error: 'TMDB_FETCH_FAILED', results: [] }, 500);
  }
}
