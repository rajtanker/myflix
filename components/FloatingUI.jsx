'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import QuickModal from '@/components/QuickModal';
import { getWatchlist, subscribeStorage } from '@/lib/storage';

export default function FloatingUI() {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);
  const [wlCount, setWlCount] = useState(0);

  useEffect(() => {
    setWlCount(getWatchlist().length);
    const unsub = subscribeStorage(() => setWlCount(getWatchlist().length));

    const onScroll = () => setShowTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      unsub();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <QuickModal />

      {showTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
        <Link href="/" className={`mbn-item ${pathname === '/' ? 'active' : ''}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>

        <Link href="/movies/" className={`mbn-item ${pathname === '/movies/' ? 'active' : ''}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <span>Movies</span>
        </Link>

        <Link href="/tv-shows/" className={`mbn-item ${pathname === '/tv-shows/' ? 'active' : ''}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
          </svg>
          <span>Series</span>
        </Link>

        <Link href="/browse/" className={`mbn-item ${pathname === '/browse/' ? 'active' : ''}`}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Explore</span>
        </Link>

        <Link href="/watchlist/" className={`mbn-item ${pathname === '/watchlist/' ? 'active' : ''}`}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {wlCount > 0 && <span className="mbn-badge">{wlCount > 9 ? '9+' : wlCount}</span>}
          </span>
          <span>Saved</span>
        </Link>
      </nav>
    </>
  );
}
