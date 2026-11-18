'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { PlayIcon, StarIcon, PlusIcon, CheckIcon } from '@/components/Icons';
import { isInWatchlist, toggleWatchlist, subscribeStorage } from '@/lib/storage';
import { langByCode } from '@/lib/constants';

export default function Card({ m, rank = null }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(m.id));
    return subscribeStorage(() => setSaved(isInWatchlist(m.id)));
  }, [m.id]);

  const href = m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`;
  const langName = langByCode(m.lang)?.name;

  return (
    <div className={`card ${rank ? 'card-ranked' : ''}`}>
      {rank && <span className="rank-num">{rank}</span>}

      <div style={{ position: 'relative' }}>
        <Link href={href} className="card-poster-link">
          <SafeImage
            src={m.poster}
            fallback="/noposter.svg"
            alt={m.title}
            className="card-poster"
          />
          <span className={`badge-type ${m.type === 'tv' ? 'tv' : ''}`}>
            {m.type === 'tv' ? 'SERIES' : 'MOVIE'}
          </span>
          {m.rating > 0 && (
            <span className="badge-rating">
              <StarIcon size={11} />
              {Number(m.rating).toFixed(1)}
            </span>
          )}
          <div className="card-hover-ov">
            <div className="play-circle">
              <PlayIcon size={20} />
            </div>
          </div>
        </Link>

        <button
          type="button"
          className={`card-wl-btn ${saved ? 'saved' : ''}`}
          aria-label={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
          title={saved ? 'In Watchlist' : 'Add to Watchlist'}
          onClick={() => toggleWatchlist(m)}
        >
          {saved ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
        </button>
      </div>

      <Link href={href} className="card-body">
        <div className="card-title" title={m.title}>{m.title}</div>
        <div className="card-sub">
          <span>{m.year || '—'}</span>
          <span>{langName || 'HD'}</span>
        </div>
      </Link>
    </div>
  );
}
