'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@/components/Icons';

export default function ShortsPlayer() {
  const [clips, setClips] = useState([]);
  const [filter, setFilter] = useState('All');
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/clips.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setClips(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = clips.filter((c) => filter === 'All' || c.clipType === filter);
  const current = filtered[idx] || filtered[0];

  const next = () => setIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
  const prev = () => setIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered.length]);

  if (loading) return <div className="empty-box">Loading movie clips &amp; shorts...</div>;
  if (!clips.length) {
    return (
      <div className="empty-box">
        <h2>No Clips Synced Yet</h2>
        <p>Run the Auto Update workflow to pull movie clips, featurettes, and trailers.</p>
      </div>
    );
  }

  return (
    <div className="shorts-layout">
      <div className="chips-scroll" style={{ justifyContent: 'center' }}>
        {['All', 'Clip', 'Featurette', 'Teaser', 'Trailer'].map((f) => (
          <button
            key={f}
            type="button"
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setIdx(0); }}
          >
            {f === 'All' ? 'All Clips' : `${f}s`}
          </button>
        ))}
      </div>

      {current && (
        <div className="shorts-stage">
          <button type="button" className="shorts-nav-btn" aria-label="Previous clip" onClick={prev}>
            <ChevronLeftIcon />
          </button>

          <div className="shorts-card">
            <div className="shorts-video-wrap">
              <iframe
                key={current.key}
                src={`https://www.youtube.com/embed/${current.key}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title={current.clipName}
              />
            </div>

            <div className="shorts-meta">
              <div>
                <span className="pill pill-acc" style={{ marginBottom: 6 }}>{current.clipType || 'Clip'}</span>
                <h3>{current.title}</h3>
                <p>{current.clipName}</p>
              </div>
              <Link href={current.href} className="btn btn-primary btn-sm">
                <PlayIcon size={14} /> Full Title
              </Link>
            </div>
          </div>

          <button type="button" className="shorts-nav-btn" aria-label="Next clip" onClick={next}>
            <ChevronRightIcon />
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--dim)', marginTop: 12 }}>
        Clip {idx + 1} of {filtered.length} • Use Left / Right arrow keys to switch clips
      </p>
    </div>
  );
}
