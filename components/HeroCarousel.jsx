jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import {
  PlayIcon,
  StarIcon,
  PlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  FilmIcon,
} from '@/components/Icons';
import { isInWatchlist, toggleWatchlist, subscribeStorage } from '@/lib/storage';

export default function HeroCarousel({ items = [] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailerKey, setTrailerKey] = useState('');
  const [savedIds, setSavedIds] = useState({});

  useEffect(() => {
    const sync = () => {
      const map = {};
      items.forEach((m) => {
        map[m.id] = isInWatchlist(m.id);
      });
      setSavedIds(map);
    };
    sync();
    return subscribeStorage(sync);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1 || paused || trailerKey) return;
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => clearInterval(t);
  }, [items.length, paused, trailerKey]);

  if (!items.length) {
    return (
      <div className="empty-box" style={{ marginBottom: 28 }}>
        <h2>Welcome to MyFlix</h2>
        <p>
          Your catalog is currently empty. Add your <code>TMDB_API_KEY</code> secret in GitHub and run the{' '}
          <strong>Auto Update Catalog</strong> workflow to automatically populate trending movies &amp; TV shows!
        </p>
        <Link href="/browse/" className="btn btn-primary">Explore Catalog</Link>
      </div>
    );
  }

  const m = items[idx] || items[0];
  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  const isSaved = !!savedIds[m.id];

  return (
    <>
      <section
        className="hero-wrap"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <SafeImage
          key={m.id}
          src={m.backdrop || m.poster}
          fallback="/nobackdrop.svg"
          alt={m.title}
          className="hero-bg"
          loading="eager"
        />
        <div className="hero-vignette" />

        <div className="hero-content">
          <div className="hero-badges">
            <span className="pill pill-acc">#{idx + 1} TRENDING</span>
            <span className="pill">{m.type === 'tv' ? 'TV SERIES' : 'MOVIE'}</span>
            {m.rating > 0 && (
              <span className="pill pill-gold">
                <StarIcon size={12} /> {Number(m.rating).toFixed(1)}
              </span>
            )}
            <span className="pill">{m.year || 'New'}</span>
            {(m.genres || []).slice(0, 2).map((g) => (
              <span key={g} className="pill">{g}</span>
            ))}
          </div>

          <h1 className="hero-title">{m.title}</h1>
          <p className="hero-overview">{m.overview || 'Stream now in HD quality.'}</p>

          <div className="hero-actions">
            <Link href={href} className="btn btn-primary">
              <PlayIcon size={17} /> Watch Now
            </Link>

            {m.trailer && (
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setTrailerKey(m.trailer)}
              >
                <FilmIcon size={16} /> Trailer
              </button>
            )}

            <button
              type="button"
              className="btn btn-glass"
              onClick={() => toggleWatchlist(m)}
            >
              {isSaved ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
              {isSaved ? 'In Watchlist' : 'Watchlist'}
            </button>
          </div>
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              className="hero-arrow prev"
              aria-label="Previous slide"
              onClick={() => setIdx((idx - 1 + items.length) % items.length)}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="hero-arrow next"
              aria-label="Next slide"
              onClick={() => setIdx((idx + 1) % items.length)}
            >
              <ChevronRightIcon />
            </button>
            <div className="hero-dots">
              {items.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={`hero-dot ${i === idx ? 'active' : ''}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {trailerKey && (
        <div className="modal-overlay" onClick={() => setTrailerKey('')}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>{m.title} — Official Trailer</strong>
              <button type="button" className="modal-close" onClick={() => setTrailerKey('')}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-video">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
