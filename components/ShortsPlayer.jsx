'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  PlayIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/Icons';
import { showToast } from '@/lib/storage';

const WATCHED_KEY = 'myflix_watched_shorts_v1';
const LIKED_KEY = 'myflix_liked_shorts_v1';
const BATCH_SIZE = 15;

function readIds(key) {
  if (typeof window === 'undefined') return [];
  try {
    const arr = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeIds(key, arr) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(arr.slice(-1000)));
  } catch {}
}

function formatViews(n = 0) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M views`;
  if (n >= 1000) return `${Math.round(n / 1000)}K views`;
  return n > 0 ? `${n} views` : 'Trending';
}

// Shuffle inside quality tiers so every visit feels fresh while keeping high-view clips on top
function buildFreshQueue(allClips, watchedIds, filter, likedSet) {
  const pool = allClips.filter((c) => {
    if (filter === 'Liked') return likedSet.has(c.id);
    if (filter === 'All') return true;
    return String(c.clipType || '').toLowerCase() === filter.toLowerCase();
  });

  const watchedSet = new Set(watchedIds);
  const unseen = pool.filter((c) => !watchedSet.has(c.id));
  const seen = pool.filter((c) => watchedSet.has(c.id));

  const shuffleTiered = (arr) => {
    const out = [];
    for (let i = 0; i < arr.length; i += 25) {
      const chunk = arr.slice(i, i + 25);
      for (let j = chunk.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [chunk[j], chunk[k]] = [chunk[k], chunk[j]];
      }
      out.push(...chunk);
    }
    return out;
  };

  return [...shuffleTiered(unseen), ...shuffleTiered(seen)];
}

export default function ShortsPlayer() {
  const [allClips, setAllClips] = useState([]);
  const [filter, setFilter] = useState('All');
  const [queue, setQueue] = useState([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likedIds, setLikedIds] = useState([]);
  const [unwatchedCount, setUnwatchedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const feedRef = useRef(null);
  const slideRefs = useRef([]);

  useEffect(() => {
    const liked = readIds(LIKED_KEY);
    setLikedIds(liked);

    fetch('/clips.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setAllClips(list);
        const watched = readIds(WATCHED_KEY);
        const wSet = new Set(watched);
        setUnwatchedCount(list.filter((c) => !wSet.has(c.id)).length);
        setQueue(buildFreshQueue(list, watched, 'All', new Set(liked)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setActiveIdx(0);
    setVisibleCount(BATCH_SIZE);
    const watched = readIds(WATCHED_KEY);
    setQueue(buildFreshQueue(allClips, watched, nextFilter, likedSet));
    if (feedRef.current) feedRef.current.scrollTo({ top: 0, behavior: 'auto' });
  };

  const refreshFeed = () => {
    const watched = readIds(WATCHED_KEY);
    setQueue(buildFreshQueue(allClips, watched, filter, likedSet));
    setActiveIdx(0);
    setVisibleCount(BATCH_SIZE);
    if (feedRef.current) feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Loaded fresh high-view reels!');
  };

  // Detect active reel while vertical scrolling
  useEffect(() => {
    const root = feedRef.current;
    if (!root || !queue.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-idx'));
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        }
      },
      { root, threshold: 0.65 }
    );

    const slides = root.querySelectorAll('.reel-slide');
    slides.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [queue, visibleCount]);

  // Infinite batch load + mark current reel watched after 1.2s
  useEffect(() => {
    if (activeIdx >= visibleCount - 4 && visibleCount < queue.length) {
      setVisibleCount((v) => Math.min(queue.length, v + BATCH_SIZE));
    }

    const current = queue[activeIdx];
    if (!current) return;

    const t = setTimeout(() => {
      const watched = readIds(WATCHED_KEY);
      if (!watched.includes(current.id)) {
        const nextWatched = [...watched, current.id];
        writeIds(WATCHED_KEY, nextWatched);
        setUnwatchedCount((c) => Math.max(0, c - 1));
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [activeIdx, queue, visibleCount]);

  // Keyboard Up / Down arrow support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToSlide(Math.min(queue.length - 1, activeIdx + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToSlide(Math.max(0, activeIdx - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, queue.length]);

  const scrollToSlide = (idx) => {
    const el = slideRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleLike = (id) => {
    const exists = likedSet.has(id);
    const next = exists ? likedIds.filter((x) => x !== id) : [id, ...likedIds];
    setLikedIds(next);
    writeIds(LIKED_KEY, next);
    showToast(exists ? 'Removed from Liked Reels' : 'Added to Liked Reels');
  };

  const handleShare = async (clip) => {
    const url = typeof window !== 'undefined' ? window.location.origin + clip.href : '';
    try {
      if (navigator.share) await navigator.share({ title: clip.title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!');
      }
    } catch {}
  };

  if (loading) {
    return <div className="empty-box" style={{ marginTop: 20 }}>Loading infinite reels feed...</div>;
  }

  const visibleQueue = queue.slice(0, visibleCount);

  return (
    <div className="reels-shell">
      <div className="reels-topbar">
        <div className="reels-tabs">
          {['All', 'Clip', 'Funny', 'Trailer', 'Anime', 'Liked'].map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => changeFilter(f)}
            >
              {f === 'All' ? `Fresh (${unwatchedCount})` : f === 'Clip' ? 'Scenes' : f}
            </button>
          ))}
        </div>

        <button type="button" className="srv-btn" onClick={refreshFeed}>
          Refresh New
        </button>
      </div>

      {visibleQueue.length === 0 ? (
        <div className="empty-box" style={{ marginTop: 20 }}>
          <h2>No Reels in this tab yet</h2>
          <p>Switch back to Fresh or run Auto Update Shorts in GitHub Actions.</p>
          <button type="button" className="btn btn-primary" onClick={() => changeFilter('All')}>
            Show Fresh Reels
          </button>
        </div>
      ) : (
        <div className="reels-stage">
          <div className="reels-feed" ref={feedRef}>
            {visibleQueue.map((c, idx) => {
              const isActive = idx === activeIdx;
              const isLiked = likedSet.has(c.id);

              return (
                <div
                  key={`${c.id}-${idx}`}
                  data-idx={idx}
                  ref={(el) => { slideRefs.current[idx] = el; }}
                  className="reel-slide"
                >
                  <div className="reel-card">
                    <div className="reel-media">
                      {isActive ? (
                        <iframe
                          key={`${c.key}-${muted ? 'm' : 'u'}`}
                          src={`https://www.youtube.com/embed/${c.key}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${c.key}&rel=0&playsinline=1&modestbranding=1`}
                          allow="autoplay; encrypted-media; fullscreen"
                          allowFullScreen
                          title={c.title}
                        />
                      ) : (
                        <img
                          src={`https://i.ytimg.com/vi/${c.key}/hqdefault.jpg`}
                          alt={c.title}
                          loading="lazy"
                        />
                      )}

                      <div className="reel-grad-bot" />

                      <div className="reel-overlay-info">
                        <div className="reel-badges">
                          <span className="pill pill-acc">{c.clipType || 'Clip'}</span>
                          <span className="pill">{formatViews(c.views)}</span>
                          {c.published && <span className="pill">{c.published.slice(0, 4)}</span>}
                        </div>
                        <h3>{c.title}</h3>
                        <p>{c.clipName}</p>
                        <Link href={c.href || '/browse/'} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                          <PlayIcon size={13} /> Watch Full Title
                        </Link>
                      </div>
                    </div>

                    <div className="reel-actions">
                      <button
                        type="button"
                        className={`reel-act-btn ${muted ? '' : 'on'}`}
                        title={muted ? 'Unmute Sound' : 'Mute Sound'}
                        onClick={() => setMuted((m) => !m)}
                      >
                        {muted ? '🔇' : '🔊'}
                        <span>{muted ? 'Sound' : 'On'}</span>
                      </button>

                      <button
                        type="button"
                        className={`reel-act-btn ${isLiked ? 'liked' : ''}`}
                        title="Like Reel"
                        onClick={() => toggleLike(c.id)}
                      >
                        <BookmarkIcon size={18} />
                        <span>{isLiked ? 'Saved' : 'Save'}</span>
                      </button>

                      <button
                        type="button"
                        className="reel-act-btn"
                        title="Share Reel"
                        onClick={() => handleShare(c)}
                      >
                        <ShareIcon size={18} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="reels-arrows">
            <button
              type="button"
              className="shorts-nav-btn"
              title="Previous Reel"
              onClick={() => scrollToSlide(Math.max(0, activeIdx - 1))}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="shorts-nav-btn"
              title="Next Reel"
              onClick={() => scrollToSlide(Math.min(queue.length - 1, activeIdx + 1))}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
