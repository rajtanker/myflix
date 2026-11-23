'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { PlayIcon, CloseIcon } from '@/components/Icons';
import { getHistory, removeFromHistory, subscribeStorage } from '@/lib/storage';

export default function ContinueWatching() {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(getHistory().slice(0, 12));
    return subscribeStorage(() => setList(getHistory().slice(0, 12)));
  }, []);

  if (!list.length) return null;

  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">
          <span className="sec-bar" />
          Continue Watching
        </h2>
        <Link href="/watchlist/" className="sec-more">History</Link>
      </div>

      <div className="row-track">
        {list.map((m) => {
          const hash = m.type === 'tv' && m.s && m.e ? `#s${m.s}e${m.e}` : '';
          const base =
            m.live || !m.slug
              ? `/watch/?type=${m.type || 'movie'}&id=${m.tmdb}`
              : m.type === 'tv'
              ? `/tv/${m.slug}/`
              : `/movie/${m.slug}/`;
          const href = base + hash;

          return (
            <div key={m.id} className="card">
              <div style={{ position: 'relative' }}>
                <Link href={href} className="card-poster-link">
                  <SafeImage src={m.poster} fallback="/noposter.svg" alt={m.title} className="card-poster" />
                  <span className={`badge-type ${m.type === 'tv' ? 'tv' : ''}`}>
                    {m.type === 'tv' ? 'SERIES' : 'MOVIE'}
                  </span>
                  {m.type === 'tv' && m.s && m.e && (
                    <span className="cw-ep-pill">S{m.s} • E{m.e}</span>
                  )}
                  <div className="card-hover-ov">
                    <div className="play-circle"><PlayIcon size={20} /></div>
                  </div>
                </Link>
                <button
                  type="button"
                  className="cw-remove"
                  title="Remove from history"
                  onClick={() => removeFromHistory(m.id)}
                >
                  <CloseIcon size={13} />
                </button>
              </div>
              <Link href={href} className="card-body">
                <div className="card-title">{m.title}</div>
                <div className="card-sub">
                  <span>{m.year || '—'}</span>
                  <span>Resume</span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
