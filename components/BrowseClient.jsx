'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import { GENRES, LANGS } from '@/lib/constants';

export default function BrowseClient({ mode = 'browse' }) {
  const searchParams = useSearchParams();
  const [localItems, setLocalItems] = useState([]);
  const [liveItems, setLiveItems] = useState([]);
  const [livePage, setLivePage] = useState(1);
  const [totalLivePages, setTotalLivePages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [genre, setGenre] = useState('all');
  const [lang, setLang] = useState('all');
  const [year, setYear] = useState('all');
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setType(searchParams.get('type') || 'all');
    setGenre(searchParams.get('genre') || 'all');
    setLang(searchParams.get('lang') || 'all');
    setSort(searchParams.get('sort') || 'popular');
  }, [searchParams]);

  useEffect(() => {
    fetch('/db.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setLocalItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch live TMDB results whenever filters or search change
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      try {
        const term = q.trim();
        const params = new URLSearchParams({
          action: term ? 'search' : 'discover',
          type: type === 'all' ? 'movie' : type,
          genre,
          lang,
          year,
          sort,
          page: '1',
        });
        if (term) {
          params.set('q', term);
          params.set('type', type);
        }
        const r = await fetch(`/api/tmdb?${params.toString()}`);
        if (!r.ok || !active) return;
        const d = await r.json();
        if (active && Array.isArray(d.results)) {
          setLiveItems(d.results);
          setLivePage(1);
          setTotalLivePages(d.totalPages || 1);
        }
      } catch {}
    }, 300);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, type, genre, lang, year, sort]);

  const loadMoreLive = async () => {
    if (loadingMore || livePage >= totalLivePages) return;
    setLoadingMore(true);
    const nextPage = livePage + 1;
    try {
      const term = q.trim();
      const params = new URLSearchParams({
        action: term ? 'search' : 'discover',
        type: term ? type : (type === 'all' ? 'movie' : type),
        genre,
        lang,
        year,
        sort,
        page: String(nextPage),
      });
      if (term) params.set('q', term);

      const r = await fetch(`/api/tmdb?${params.toString()}`);
      const d = r.ok ? await r.json() : {};
      if (Array.isArray(d.results)) {
        setLiveItems((prev) => [...prev, ...d.results]);
        setLivePage(nextPage);
      }
    } catch {}
    setLoadingMore(false);
  };

  const merged = useMemo(() => {
    const term = q.trim().toLowerCase();
    const localFiltered = localItems.filter((m) => {
      if (type !== 'all' && m.type !== type) return false;
      if (genre !== 'all' && !(m.genres || []).some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
      if (lang !== 'all' && m.lang !== lang) return false;
      if (year !== 'all') {
        const y = Number(m.year);
        if (['2026', '2025', '2024'].includes(year) && y !== Number(year)) return false;
        if (year === '2020s' && (y < 2020 || y > 2029)) return false;
        if (year === '2010s' && (y < 2010 || y > 2019)) return false;
        if (year === '2000s' && (y < 2000 || y > 2009)) return false;
        if (year === '1990s' && (y < 1990 || y > 1999)) return false;
        if (year === 'classic' && y >= 1990) return false;
      }
      if (term) {
        const matchTitle = (m.title || '').toLowerCase().includes(term);
        const matchGenre = (m.genres || []).some((g) => g.toLowerCase().includes(term));
        const matchCast = (m.cast || []).some((c) => c.toLowerCase().includes(term));
        const matchDir = (m.director || '').toLowerCase().includes(term);
        const matchYear = String(m.year || '').includes(term);
        if (!matchTitle && !matchGenre && !matchCast && !matchDir && !matchYear) return false;
      }
      return true;
    });

    if (sort === 'rating') localFiltered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'newest') localFiltered.sort((a, b) => (b.releaseDate || String(b.year || '')).localeCompare(a.releaseDate || String(a.year || '')));
    else if (sort === 'az') localFiltered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else localFiltered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    const localMap = new Map(localItems.map((x) => [x.id, x]));
    const out = [...localFiltered];
    const seen = new Set(out.map((x) => x.id));

    for (const live of liveItems) {
      if (seen.has(live.id)) continue;
      seen.add(live.id);
      out.push(localMap.get(live.id) || live);
    }

    return out;
  }, [localItems, liveItems, q, type, genre, lang, year, sort]);

  const resetFilters = () => {
    setQ('');
    setType('all');
    setGenre('all');
    setLang('all');
    setYear('all');
    setSort('popular');
  };

  return (
    <>
      <div className="page-banner" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <h1>{mode === 'search' && q ? `Global Search: "${q}"` : 'Unlimited Catalog Explorer'}</h1>
          <p>Search &amp; filter across 1,000,000+ movies, web series, anime &amp; classics.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => window.dispatchEvent(new Event('myflix:surprise'))}
        >
          Surprise Me!
        </button>
      </div>

      <div className="filter-panel">
        <div className="filter-field">
          <label htmlFor="f-q">Keyword / Actor</label>
          <input
            id="f-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Any movie, series, actor..."
          />
        </div>

        <div className="filter-field">
          <label htmlFor="f-type">Type</label>
          <select id="f-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Movies &amp; Series</option>
            <option value="movie">Movies Only</option>
            <option value="tv">TV &amp; Web Series</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-genre">Genre</label>
          <select id="f-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="all">All Genres</option>
            {GENRES.map((g) => (
              <option key={g.slug} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-lang">Language</label>
          <select id="f-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="all">All Languages</option>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-year">Era / Year</label>
          <select id="f-year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">All Eras (1920–2026)</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2020s">2020s</option>
            <option value="2010s">2010s</option>
            <option value="2000s">2000s</option>
            <option value="1990s">1990s</option>
            <option value="classic">Pre-1990 Classics</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-sort">Sort By</label>
          <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="newest">Newest Release</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="filter-summary">
        <span>{loading ? 'Loading...' : `Showing ${merged.length} titles (Live TMDB Connected)`}</span>
        {(q || type !== 'all' || genre !== 'all' || lang !== 'all' || year !== 'all') && (
          <button type="button" className="srv-btn" onClick={resetFilters}>Reset Filters</button>
        )}
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : merged.length === 0 ? (
        <div className="empty-box">
          <h2>No matching titles found</h2>
          <p>Try another keyword or clear your filters.</p>
          <button type="button" className="btn btn-primary" onClick={resetFilters}>Clear Filters</button>
        </div>
      ) : (
        <>
          <div className="grid">
            {merged.map((m) => <Card key={m.id} m={m} />)}
          </div>
          {livePage < totalLivePages && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loadingMore}
                onClick={loadMoreLive}
              >
                {loadingMore ? 'Loading more from TMDB...' : `Load More Titles (Page ${livePage + 1} of ${totalLivePages})`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
