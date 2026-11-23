'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import { GENRES, LANGS } from '@/lib/constants';

const PAGE_SIZE = 36;

export default function BrowseClient({ mode = 'browse' }) {
  const searchParams = useSearchParams();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [genre, setGenre] = useState('all');
  const [lang, setLang] = useState('all');
  const [year, setYear] = useState('all');
  const [sort, setSort] = useState('popular');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setType(searchParams.get('type') || 'all');
    setGenre(searchParams.get('genre') || 'all');
    setLang(searchParams.get('lang') || 'all');
    setSort(searchParams.get('sort') || 'popular');
    setVisible(PAGE_SIZE);
  }, [searchParams]);

  useEffect(() => {
    fetch('/db.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setAllItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = allItems.filter((m) => {
      if (type !== 'all' && m.type !== type) return false;
      if (genre !== 'all' && !(m.genres || []).some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
      if (lang !== 'all' && m.lang !== lang) return false;
      if (year !== 'all') {
        const y = Number(m.year);
        if (year === '2026' && y !== 2026) return false;
        if (year === '2025' && y !== 2025) return false;
        if (year === '2024' && y !== 2024) return false;
        if (year === '2020s' && (y < 2020 || y > 2029)) return false;
        if (year === '2010s' && (y < 2010 || y > 2019)) return false;
        if (year === 'classic' && y >= 2010) return false;
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

    const sorted = [...list];
    if (sort === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'newest') {
      sorted.sort((a, b) => (b.releaseDate || String(b.year || '')).localeCompare(a.releaseDate || String(a.year || '')));
    } else if (sort === 'az') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
    return sorted;
  }, [allItems, q, type, genre, lang, year, sort]);

  const resetFilters = () => {
    setQ('');
    setType('all');
    setGenre('all');
    setLang('all');
    setYear('all');
    setSort('popular');
    setVisible(PAGE_SIZE);
  };

  return (
    <>
      <div className="page-banner" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <h1>{mode === 'search' && q ? `Search Results: "${q}"` : 'Explore Movies & TV Shows'}</h1>
          <p>Search by title, actor, director, genre, language, or release era.</p>
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
            onChange={(e) => { setQ(e.target.value); setVisible(PAGE_SIZE); }}
            placeholder="Movie, actor, director..."
          />
        </div>

        <div className="filter-field">
          <label htmlFor="f-type">Type</label>
          <select id="f-type" value={type} onChange={(e) => { setType(e.target.value); setVisible(PAGE_SIZE); }}>
            <option value="all">All Types</option>
            <option value="movie">Movies Only</option>
            <option value="tv">TV Series Only</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-genre">Genre</label>
          <select id="f-genre" value={genre} onChange={(e) => { setGenre(e.target.value); setVisible(PAGE_SIZE); }}>
            <option value="all">All Genres</option>
            {GENRES.map((g) => (
              <option key={g.slug} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-lang">Language</label>
          <select id="f-lang" value={lang} onChange={(e) => { setLang(e.target.value); setVisible(PAGE_SIZE); }}>
            <option value="all">All Languages</option>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-year">Release</label>
          <select id="f-year" value={year} onChange={(e) => { setYear(e.target.value); setVisible(PAGE_SIZE); }}>
            <option value="all">Any Year</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2020s">2020 – 2029</option>
            <option value="2010s">2010 – 2019</option>
            <option value="classic">Pre-2010 Classics</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="f-sort">Sort By</label>
          <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">Most Popular</option>
            <option value="newest">Newest Release</option>
            <option value="rating">Highest Rated</option>
            <option value="az">Title (A – Z)</option>
          </select>
        </div>
      </div>

      <div className="filter-summary">
        <span>
          {loading ? 'Loading catalog...' : `Showing ${Math.min(visible, filtered.length)} of ${filtered.length} titles`}
        </span>
        {(q || type !== 'all' || genre !== 'all' || lang !== 'all' || year !== 'all') && (
          <button type="button" className="srv-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-box">
          <h2>No matching titles found</h2>
          <p>Try clearing a filter or searching with another keyword.</p>
          <button type="button" className="btn btn-primary" onClick={resetFilters}>Clear All Filters</button>
        </div>
      ) : (
        <>
          <div className="grid">
            {filtered.slice(0, visible).map((m) => (
              <Card key={m.id} m={m} />
            ))}
          </div>
          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Load More ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
