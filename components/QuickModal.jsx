'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import {
  PlayIcon,
  StarIcon,
  PlusIcon,
  CheckIcon,
  CloseIcon,
  FilmIcon,
} from '@/components/Icons';
import { isInWatchlist, toggleWatchlist, subscribeStorage } from '@/lib/storage';
import { genreNameToSlug, langByCode } from '@/lib/constants';

let cachedDb = null;
async function fetchDb() {
  if (cachedDb) return cachedDb;
  try {
    const r = await fetch('/db.json');
    const data = r.ok ? await r.json() : [];
    cachedDb = Array.isArray(data) ? data : [];
    return cachedDb;
  } catch {
    return [];
  }
}

export default function QuickModal() {
  const [item, setItem] = useState(null);
  const [isSurprise, setIsSurprise] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onPreview = (e) => {
      if (!e.detail) return;
      setIsSurprise(false);
      setShowTrailer(false);
      setItem(e.detail);
    };

    const onSurprise = async () => {
      const db = await fetchDb();
      const pool = db.filter((x) => (x.rating || 0) >= 6.4 && x.poster);
      const source = pool.length ? pool : db;
      if (!source.length) return;
      const pick = source[Math.floor(Math.random() * source.length)];
      setIsSurprise(true);
      setShowTrailer(false);
      setItem(pick);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') setItem(null);
    };

    window.addEventListener('myflix:preview', onPreview);
    window.addEventListener('myflix:surprise', onSurprise);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('myflix:preview', onPreview);
      window.removeEventListener('myflix:surprise', onSurprise);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    setSaved(isInWatchlist(item.id));
    const unsub = subscribeStorage(() => setSaved(isInWatchlist(item.id)));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      unsub();
      document.body.style.overflow = prevOverflow;
    };
  }, [item]);

  if (!item) return null;

  const href =
  item.live || !item.slug
    ? `/watch/?type=${item.type || 'movie'}&id=${item.tmdb}`
    : item.type === 'tv'
    ? `/tv/${item.slug}/`
    : `/movie/${item.slug}/`;
  const langObj = langByCode(item.lang);

  const rollAnother = async () => {
    const db = await fetchDb();
    const pool = db.filter((x) => x.id !== item.id && (x.rating || 0) >= 6.4);
    const source = pool.length ? pool : db;
    if (!source.length) return;
    setShowTrailer(false);
    setItem(source[Math.floor(Math.random() * source.length)]);
  };

  return (
    <div className="modal-overlay" onClick={() => setItem(null)}>
      <div className="qm-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close qm-close"
          aria-label="Close preview"
          onClick={() => setItem(null)}
        >
          <CloseIcon />
        </button>

        <div className="qm-hero">
          {showTrailer && item.trailer ? (
            <iframe
              src={`https://www.youtube.com/embed/${item.trailer}?autoplay=1`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={`${item.title} Trailer`}
            />
          ) : (
            <>
              <SafeImage
                src={item.backdrop || item.poster}
                fallback="/nobackdrop.svg"
                alt={item.title}
                className="qm-hero-img"
              />
              <div className="qm-hero-fade" />
              <div className="qm-hero-head">
                {isSurprise && (
                  <span className="pill pill-acc" style={{ marginBottom: 8 }}>
                    SURPRISE PICK FOR YOU
                  </span>
                )}
                <h2>{item.title}</h2>
              </div>
            </>
          )}
        </div>

        <div className="qm-body">
          <div className="meta-badges">
            <span className="meta-pill">{item.type === 'tv' ? 'TV Series' : 'Movie'}</span>
            {item.rating > 0 && (
              <span className="meta-pill gold">
                <StarIcon size={12} /> {Number(item.rating).toFixed(1)}
              </span>
            )}
            {item.year && <span className="meta-pill">{item.year}</span>}
            {item.runtime > 0 && <span className="meta-pill">{item.runtime} min</span>}
            {item.type === 'tv' && item.seasons > 0 && (
              <span className="meta-pill">{item.seasons} Seasons</span>
            )}
            {langObj && (
              <Link href={`/language/${langObj.slug}/`} className="meta-pill link" onClick={() => setItem(null)}>
                {langObj.name}
              </Link>
            )}
            {(item.genres || []).map((g) => (
              <Link key={g} href={`/genre/${genreNameToSlug(g)}/`} className="meta-pill link" onClick={() => setItem(null)}>
                {g}
              </Link>
            ))}
          </div>

          <p className="qm-overview">
            {item.overview || 'Stream this title now in full HD on MyFlix.'}
          </p>

          {item.cast?.length > 0 && (
            <div className="qm-cast">
              <strong>Cast:</strong>{' '}
              {item.cast.slice(0, 5).map((actor, i) => (
                <span key={actor}>
                  {i > 0 && ', '}
                  <Link href={`/browse/?q=${encodeURIComponent(actor)}`} onClick={() => setItem(null)}>
                    {actor}
                  </Link>
                </span>
              ))}
            </div>
          )}

          <div className="qm-actions">
            <Link href={href} className="btn btn-primary" onClick={() => setItem(null)}>
              <PlayIcon size={17} /> Watch Now
            </Link>

            {item.trailer && (
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setShowTrailer((v) => !v)}
              >
                <FilmIcon size={16} /> {showTrailer ? 'Hide Trailer' : 'Play Trailer'}
              </button>
            )}

            <button
              type="button"
              className="btn btn-glass"
              onClick={() => toggleWatchlist(item)}
            >
              {saved ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
              {saved ? 'In Watchlist' : 'Watchlist'}
            </button>

            {isSurprise && (
              <button type="button" className="btn btn-glass" onClick={rollAnother}>
                Roll Another
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
