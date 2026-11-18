'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SITE } from '@/lib/config';
import { getWatchlist, subscribeStorage } from '@/lib/storage';
import { SearchIcon, BookmarkIcon, MenuIcon, CloseIcon, PlayIcon, StarIcon } from '@/components/Icons';
import SafeImage from '@/components/SafeImage';

let catalogPromise = null;
function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch('/db.json')
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return catalogPromise;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [wlCount, setWlCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [openDrop, setOpenDrop] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    setWlCount(getWatchlist().length);
    return subscribeStorage(() => setWlCount(getWatchlist().length));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDrop(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setOpenDrop(false);
        setMenuOpen(false);
        inputRef.current?.blur();
      }
    };
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenDrop(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const handleInput = async (val) => {
    setQ(val);
    const term = val.trim().toLowerCase();
    if (term.length < 2) {
      setResults([]);
      setOpenDrop(false);
      return;
    }
    const items = await loadCatalog();
    const matches = items
      .filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          (m.genres || []).some((g) => g.toLowerCase().includes(term))
      )
      .slice(0, 6);
    setResults(matches);
    setOpenDrop(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpenDrop(false);
    router.push(`/search/?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <span className="logo-badge">
              <PlayIcon size={15} />
            </span>
            <span>
              {SITE.brandPrefix}
              <span className="logo-accent">{SITE.brandAccent}</span>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
            <Link href="/movies/" className={pathname === '/movies/' ? 'active' : ''}>Movies</Link>
            <Link href="/tv-shows/" className={pathname === '/tv-shows/' ? 'active' : ''}>TV Shows</Link>
            <Link href="/browse/" className={pathname === '/browse/' ? 'active' : ''}>Browse</Link>
            <Link href="/watchlist/" className={pathname === '/watchlist/' ? 'active' : ''}>
              <BookmarkIcon size={15} />
              Watchlist
              {wlCount > 0 && <span className="wl-count">{wlCount}</span>}
            </Link>
          </nav>

          <div className="search-wrap" ref={wrapRef}>
            <form className="search-box" onSubmit={handleSubmit}>
              <span className="search-ico"><SearchIcon size={15} /></span>
              <input
                ref={inputRef}
                type="search"
                value={q}
                onFocus={() => { if (results.length) setOpenDrop(true); loadCatalog(); }}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search movies, series, genres..."
                aria-label="Search catalog"
              />
              <span className="kbd-hint">/</span>
            </form>

            {openDrop && q.trim().length >= 2 && (
              <div className="search-dropdown">
                {results.length > 0 ? (
                  <>
                    {results.map((m) => (
                      <Link
                        key={m.id}
                        href={m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`}
                        className="search-item"
                        onClick={() => setOpenDrop(false)}
                      >
                        <SafeImage src={m.poster} fallback="/noposter.svg" alt={m.title} />
                        <div className="search-item-info">
                          <div className="search-item-title">{m.title}</div>
                          <div className="search-item-meta">
                            <span>{m.type === 'tv' ? 'TV Series' : 'Movie'}</span>
                            <span>•</span>
                            <span>{m.year || '—'}</span>
                            {m.rating > 0 && (
                              <>
                                <span>•</span>
                                <span style={{ color: '#f5c518', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <StarIcon size={11} /> {Number(m.rating).toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/search/?q=${encodeURIComponent(q.trim())}`}
                      className="search-all-btn"
                      onClick={() => setOpenDrop(false)}
                    >
                      View all results for &ldquo;{q.trim()}&rdquo; →
                    </Link>
                  </>
                ) : (
                  <div style={{ padding: 16, fontSize: 13, color: '#9aa0b4', textAlign: 'center' }}>
                    No instant matches for &ldquo;{q.trim()}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Toggle Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-drawer">
          <Link href="/">Home</Link>
          <Link href="/movies/">Movies</Link>
          <Link href="/tv-shows/">TV Shows</Link>
          <Link href="/browse/">Explore &amp; Filter</Link>
          <Link href="/watchlist/">
            <span>My Watchlist</span>
            {wlCount > 0 && <span className="wl-count">{wlCount}</span>}
          </Link>
        </div>
      )}
    </>
  );
}
