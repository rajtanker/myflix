'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SITE } from '@/lib/config';
import { getWatchlist, subscribeStorage } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import {
  SearchIcon,
  MenuIcon,
  CloseIcon,
  PlayIcon,
  StarIcon,
  SettingsIcon,
  ChevronDownIcon,
} from '@/components/Icons';
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
  const { t } = useI18n();
  const [wlCount, setWlCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [openDrop, setOpenDrop] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const moreRef = useRef(null);
  const timerRef = useRef(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    setWlCount(getWatchlist().length);
    return subscribeStorage(() => setWlCount(getWatchlist().length));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDrop(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setOpenDrop(false);
        setMenuOpen(false);
        setMoreOpen(false);
      }
    };
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenDrop(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
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
    clearTimeout(timerRef.current);
    const reqId = ++reqIdRef.current;

    if (term.length < 2) {
      setResults([]);
      setOpenDrop(false);
      return;
    }

    const items = await loadCatalog();
    if (reqId !== reqIdRef.current) return;

    const localMatches = items
      .filter(
        (m) =>
          (m.title || '').toLowerCase().includes(term) ||
          (m.genres || []).some((g) => g.toLowerCase().includes(term)) ||
          (m.cast || []).some((c) => c.toLowerCase().includes(term))
      )
      .slice(0, 6);

    setResults(localMatches);
    setOpenDrop(true);

    // Also pull from Live TMDB (1M+ titles) after short debounce
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/tmdb?action=search&q=${encodeURIComponent(val.trim())}&page=1`);
        if (!r.ok || reqId !== reqIdRef.current) return;
        const d = await r.json();
        const localMap = new Map(items.map((x) => [x.id, x]));
        const merged = [...localMatches];
        const seen = new Set(localMatches.map((x) => x.id));

        for (const liveItem of d.results || []) {
          if (seen.has(liveItem.id)) continue;
          seen.add(liveItem.id);
          merged.push(localMap.get(liveItem.id) || liveItem);
          if (merged.length >= 8) break;
        }
        if (reqId === reqIdRef.current) setResults(merged);
      } catch {}
    }, 320);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpenDrop(false);
    router.push(`/search/?q=${encodeURIComponent(term)}`);
  };

  const getItemHref = (m) =>
    m.live || !m.slug
      ? `/watch/?type=${m.type || 'movie'}&id=${m.tmdb}`
      : m.type === 'tv'
      ? `/tv/${m.slug}/`
      : `/movie/${m.slug}/`;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <span className="logo-badge"><PlayIcon size={15} /></span>
            <span>{SITE.brandPrefix}<span className="logo-accent">{SITE.brandAccent}</span></span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>{t('home')}</Link>
            <Link href="/movies/" className={pathname === '/movies/' ? 'active' : ''}>{t('movies')}</Link>
            <Link href="/tv-shows/" className={pathname === '/tv-shows/' ? 'active' : ''}>{t('series')}</Link>
            <Link href="/anime/" className={pathname === '/anime/' ? 'active' : ''}>{t('anime')}</Link>
            <Link href="/shorts/" className={pathname === '/shorts/' ? 'active' : ''}>{t('shorts')}</Link>

            <div className="more-wrap" ref={moreRef}>
              <button type="button" className="more-btn" onClick={() => setMoreOpen((v) => !v)}>
                {t('more')} <ChevronDownIcon size={14} />
              </button>
              {moreOpen && (
                <div className="more-menu">
                  <Link href="/browse/">{t('browse')}</Link>
                  <Link href="/collections/">Top Collections</Link>
                  <Link href="/quiz/">Movie Quiz Game</Link>
                  <Link href="/upcoming/">{t('upcoming')}</Link>
                  <Link href="/news/">{t('news')}</Link>
                  <Link href="/watchlist/">
                    <span>{t('watchlist')}</span>
                    {wlCount > 0 && <span className="wl-count">{wlCount}</span>}
                  </Link>
                  <button type="button" onClick={() => { setMoreOpen(false); window.dispatchEvent(new Event('myflix:cinebot')); }}>
                    {t('cinebot')}
                  </button>
                  <button type="button" onClick={() => { setMoreOpen(false); window.dispatchEvent(new Event('myflix:settings')); }}>
                    {t('settings')}
                  </button>
                </div>
              )}
            </div>
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
                placeholder={t('searchPh')}
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
                        href={getItemHref(m)}
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
                      Search all 1,000,000+ titles for &ldquo;{q.trim()}&rdquo; →
                    </Link>
                  </>
                ) : (
                  <div style={{ padding: 16, fontSize: 13, color: '#9aa0b4', textAlign: 'center' }}>
                    Searching global catalog for &ldquo;{q.trim()}&rdquo;...
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="header-icon-btn"
            aria-label="Settings"
            title={t('settings')}
            onClick={() => window.dispatchEvent(new Event('myflix:settings'))}
          >
            <SettingsIcon size={18} />
          </button>

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
          <Link href="/">{t('home')}</Link>
          <Link href="/movies/">{t('movies')}</Link>
          <Link href="/tv-shows/">{t('series')}</Link>
          <Link href="/anime/">{t('anime')}</Link>
          <Link href="/shorts/">{t('shorts')}</Link>
          <Link href="/upcoming/">{t('upcoming')}</Link>
          <Link href="/browse/">{t('browse')}</Link>
          <Link href="/news/">{t('news')}</Link>
          <Link href="/watchlist/">
            <span>{t('watchlist')}</span>
            {wlCount > 0 && <span className="wl-count">{wlCount}</span>}
          </Link>
        </div>
      )}
    </>
  );
}
