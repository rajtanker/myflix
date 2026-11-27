'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PlusIcon,
  CheckIcon,
  MoonIcon,
  ShareIcon,
  FilmIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/Icons';
import {
  isInWatchlist,
  toggleWatchlist,
  saveToHistory,
  subscribeStorage,
  showToast,
} from '@/lib/storage';

const EP_PAGE_SIZE = 30;
const LOAD_TIMEOUT = 9000;
const PROBE_TIMEOUT = 4500;
const MAX_AUTO = 6;
const DEAD_KEY = 'myflix.deadservers';

const NX = 'https://nxsha.space/embed';
const NXQ = '?lang=en&autoplay=true&sub=en';

const SERVERS = [
  { name: 'VidHindi', hint: 'Hindi • Fast', m: `${NX}/movie/{tmdb}?server=vidhindi&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=vidhindi&lang=en&autoplay=true&sub=en` },
  { name: 'VidLink Pro', hint: '1080p', m: 'https://vidlink.pro/movie/{tmdb}', t: 'https://vidlink.pro/tv/{tmdb}/{s}/{e}' },
  { name: 'MultiEmbed Mirror', hint: 'Multi', m: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1', t: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1&s={s}&e={e}' },
  { name: 'Nexus HD', hint: 'HD', m: `${NX}/movie/{tmdb}${NXQ}`, t: `${NX}/tv/{tmdb}/{s}/{e}${NXQ}` },
  { name: 'Nitro Multi', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=nitro&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=nitro&lang=en&autoplay=true&sub=en` },
  { name: 'Mahalala Multi', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=mahalala&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=mahalala&lang=en&autoplay=true&sub=en` },
  { name: 'CastVid Multi', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=castvid&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=castvid&lang=en&autoplay=true&sub=en` },
  { name: 'VidBo', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=vidbo&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=vidbo&lang=en&autoplay=true&sub=en` },
  { name: 'StremFx', hint: 'Alt', m: `${NX}/movie/{tmdb}?server=stremfx&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=stremfx&lang=en&autoplay=true&sub=en` },
  { name: 'VidSrc', hint: 'HD', m: 'https://vidsrc.sh/embed/movie/{tmdb}', t: 'https://vidsrc.sh/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'Astra', hint: 'Multi', m: 'https://player-4aq.pages.dev/embed/movie/{tmdb}?autoPlay=true', t: 'https://player-4aq.pages.dev/embed/tv/{tmdb}/{s}/{e}?autoPlay=true' },
];

function readDead() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(DEAD_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeDead(list) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DEAD_KEY, JSON.stringify(list.slice(-40)));
  } catch {}
}

function preflight(url) {
  return new Promise((resolve) => {
    let done = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      ctrl.abort();
      resolve(false);
    }, PROBE_TIMEOUT);

    fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
      .then(() => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(true);
      })
      .catch(() => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(false);
      });
  });
}

const fill = (tpl, tmdb, s, e) =>
  (tpl || '')
    .replace('{tmdb}', String(tmdb))
    .replace('{s}', String(s))
    .replace('{e}', String(e));

export default function Player({ item, servers = [] }) {
  const seasons = useMemo(() => {
    if (item.type !== 'tv') return [];
    if (Array.isArray(item.seasonList) && item.seasonList.length > 0) return item.seasonList;
    return [{ s: 1, eps: 12 }];
  }, [item]);

  // Put VidHindi & SERVERS first, then any extra prop servers without duplicates
  const list = useMemo(() => {
    const base = SERVERS.map((s) => ({
      name: s.name,
      hint: s.hint,
      tpl: item.type === 'tv' ? s.t : s.m,
    })).filter((s) => Boolean(s.tpl));

    const extra = (servers || [])
      .filter((s) => s && (s.tpl || s.m))
      .map((s) => ({
        name: s.name || 'Custom',
        hint: s.hint || '',
        tpl: item.type === 'tv' ? (s.t || s.tpl) : (s.m || s.tpl),
      }))
      .filter((s) => Boolean(s.tpl));

    const merged = [...base, ...extra];
    const seen = new Set();
    return merged.filter((s) => {
      if (!s.tpl || seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });
  }, [servers, item.type]);

  const listKey = list.map((s) => s.name).join('|');
  const listRef = useRef(list);
  listRef.current = list;

  const [activeName, setActiveName] = useState('');
  const [phase, setPhase] = useState('checking');
  const [probe, setProbe] = useState({});
  const [deadList, setDeadList] = useState([]);
  const [autoTries, setAutoTries] = useState(0);
  const [season, setSeason] = useState(seasons[0]?.s || 1);
  const [ep, setEp] = useState(1);
  const [epPage, setEpPage] = useState(0);
  const [theater, setTheater] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [saved, setSaved] = useState(false);

  // Smart Scroll Passthrough & Fullscreen Lock
  const [engaged, setEngaged] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const timerRef = useRef(null);
  const autoRef = useRef(0);
  const runRef = useRef(0);
  const loadedRef = useRef(false);

  const active = list.find((s) => s.name === activeName) || null;

  /* Working first (VidHindi stays #1 if working), untested middle, failed last; hide VidHindi completely if dead */
  const ordered = useMemo(() => {
    const score = (n) => {
      const st = probe[n];
      if (n === 'VidHindi' && st === 'ok') return -1;
      if (st === 'ok') return 0;
      if (st === 'fail') return 2;
      return 1;
    };
    return [...list]
      .filter((s) => {
        if (s.name === 'VidHindi') {
          const st = probe['VidHindi'];
          if (st === 'fail' || (st !== 'ok' && deadList.includes('VidHindi'))) return false;
        }
        return true;
      })
      .sort((a, b) => score(a.name) - score(b.name));
  }, [list, probe, deadList]);

  const markDead = useCallback((name) => {
    if (!name) return;
    const d = readDead();
    if (!d.includes(name)) {
      const next = [...d, name];
      writeDead(next);
      setDeadList(next);
    }
  }, []);

  const markAlive = useCallback((name) => {
    if (!name) return;
    const d = readDead();
    if (d.includes(name)) {
      const next = d.filter((x) => x !== name);
      writeDead(next);
      setDeadList(next);
    }
  }, []);

  useEffect(() => {
    setDeadList(readDead());
    if (typeof window !== 'undefined') {
      setIsTouch(window.matchMedia?.('(pointer: coarse)')?.matches || false);
      const m = window.location.hash.match(/^#s(\d+)e(\d+)$/i);
      if (item.type === 'tv' && m) {
        const sNum = Number(m[1]);
        const eNum = Number(m[2]);
        const found = seasons.find((x) => x.s === sNum);
        if (found) {
          setSeason(sNum);
          const safeEp = Math.min(Math.max(1, eNum), found.eps);
          setEp(safeEp);
          setEpPage(Math.floor((safeEp - 1) / EP_PAGE_SIZE));
        }
      }
    }
  }, [item.type, seasons]);

  useEffect(() => {
    const onFs = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      const activeFs = Boolean(fsEl);
      setIsFullscreen(activeFs);
      if (activeFs) {
        setEngaged(true);
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setSaved(isInWatchlist(item.id));
    return subscribeStorage(() => setSaved(isInWatchlist(item.id)));
  }, [item.id]);

  useEffect(() => {
    if (!item?.id) return;
    if (item.type === 'tv') saveToHistory(item, season, ep);
    else saveToHistory(item);
  }, [item, season, ep]);

  const activeSeasonObj = seasons.find((x) => x.s === season) || seasons[0] || { s: 1, eps: 1 };
  const totalEps = activeSeasonObj.eps || 1;
  const totalPages = Math.ceil(totalEps / EP_PAGE_SIZE);
  const pageStart = epPage * EP_PAGE_SIZE + 1;
  const pageEnd = Math.min(totalEps, (epPage + 1) * EP_PAGE_SIZE);
  const epNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  /* Parallel probe — auto-plays VidHindi immediately if working, otherwise skips it */
  useEffect(() => {
    runRef.current += 1;
    const run = runRef.current;
    autoRef.current = 0;
    loadedRef.current = false;
    setAutoTries(0);
    setActiveName('');
    setPhase('checking');
    setProbe({});

    let cancelled = false;
    const current = listRef.current;

    (async () => {
      const results = await Promise.all(
        current.map(async (s) => ({
          name: s.name,
          ok: await preflight(fill(s.tpl, item.tmdb, season, ep)),
        }))
      );
      if (cancelled || run !== runRef.current) return;

      const map = {};
      results.forEach((r) => {
        map[r.name] = r.ok ? 'ok' : 'fail';
        if (r.ok) markAlive(r.name);
        else markDead(r.name);
      });
      setProbe(map);

      const vidHindi = results.find((r) => r.name === 'VidHindi');
      const good = results.filter((r) => r.ok).map((r) => r.name);
      const deadNow = readDead();

      const target =
        (vidHindi?.ok ? 'VidHindi' : '') ||
        good.find((n) => !deadNow.includes(n)) ||
        good[0] ||
        current.find((s) => s.name !== 'VidHindi')?.name ||
        current[0]?.name ||
        '';

      if (!target) {
        setPhase('failed');
        return;
      }
      setActiveName(target);
      setPhase('loading');
    })();

    return () => {
      cancelled = true;
    };
  }, [item.tmdb, season, ep, listKey, markDead, markAlive]);

  const currentUrl = useMemo(() => {
    if (!active) return '';
    return fill(active.tpl, item.tmdb, season, ep);
  }, [active, item.tmdb, season, ep]);

  /* Fallback timer */
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!currentUrl || !activeName) return;
    if (loadedRef.current) return;

    setPhase((p) => (p === 'checking' ? p : 'loading'));

    timerRef.current = setTimeout(() => {
      if (loadedRef.current) return;

      markDead(activeName);
      setProbe((p) => ({ ...p, [activeName]: 'fail' }));

      const curIdx = listRef.current.findIndex((s) => s.name === activeName);
      const deadNow = readDead();
      const next = listRef.current
        .slice(curIdx + 1)
        .find((s) => s.name !== activeName && !deadNow.includes(s.name));

      if (next && autoRef.current < MAX_AUTO) {
        autoRef.current += 1;
        setAutoTries(autoRef.current);
        setActiveName(next.name);
      } else {
        setPhase('failed');
      }
    }, LOAD_TIMEOUT);

    return () => clearTimeout(timerRef.current);
  }, [currentUrl, activeName, markDead]);

  const handleLoaded = () => {
    clearTimeout(timerRef.current);
    loadedRef.current = true;
    markAlive(activeName);
    setProbe((p) => ({ ...p, [activeName]: 'ok' }));
    setPhase('ok');
  };

  const pickServer = (name) => {
    autoRef.current = 0;
    loadedRef.current = false;
    setAutoTries(0);
    setActiveName(name);
    setEngaged(true);
    setPhase('loading');
  };

  const nextSource = () => {
    const curIdx = ordered.findIndex((s) => s.name === activeName);
    const next = ordered.slice(curIdx + 1).find((s) => s.name !== activeName);
    if (next) pickServer(next.name);
    else showToast('Last server — pick another below');
  };

  const retryAll = () => {
    writeDead([]);
    setDeadList([]);
    autoRef.current = 0;
    loadedRef.current = false;
    setAutoTries(0);
    setProbe({});
    const first = ordered[0]?.name || list[0]?.name;
    if (first) {
      setActiveName(first === activeName ? ordered[1]?.name || first : first);
      setPhase('loading');
    }
  };

  const selectSeason = (sNum) => {
    setSeason(sNum);
    setEp(1);
    setEpPage(0);
  };

  const selectEpisode = (eNum) => {
    setEp(eNum);
    setEpPage(Math.floor((eNum - 1) / EP_PAGE_SIZE));
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#s${season}e${eNum}`);
    }
  };

  const goPrevEp = () => {
    if (ep > 1) selectEpisode(ep - 1);
    else {
      const idx = seasons.findIndex((x) => x.s === season);
      if (idx > 0) {
        const prevS = seasons[idx - 1];
        setSeason(prevS.s);
        setEp(prevS.eps);
        setEpPage(Math.floor((prevS.eps - 1) / EP_PAGE_SIZE));
      }
    }
  };

  const goNextEp = () => {
    if (ep < totalEps) selectEpisode(ep + 1);
    else {
      const idx = seasons.findIndex((x) => x.s === season);
      if (idx >= 0 && idx < seasons.length - 1) {
        const nextS = seasons[idx + 1];
        setSeason(nextS.s);
        setEp(1);
        setEpPage(0);
      }
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      }
    } catch {}
  };

  const allowIframePointer = isTouch || engaged || isFullscreen;

  return (
    <>
      {theater && <div className="theater-backdrop" onClick={() => setTheater(false)} />}

      <div className={`player-shell ${theater ? 'theater' : ''}`}>
        <div
          className="player-frame-wrap"
          style={{ position: 'relative' }}
          onMouseLeave={() => {
            if (!isFullscreen) setEngaged(false);
          }}
        >
          {currentUrl && (
            <iframe
              key={currentUrl}
              src={currentUrl}
              style={{ pointerEvents: allowIframePointer ? 'auto' : 'none' }}
              allowFullScreen
              referrerPolicy="origin"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              title={item.title}
              onLoad={handleLoaded}
            />
          )}

          {/* Auto Scroll-Passthrough Overlay on Desktop (Never blocks Fullscreen) */}
          {!allowIframePointer && phase === 'ok' && (
            <div
              className="player-scroll-overlay"
              onClick={() => setEngaged(true)}
              title="Click to interact with video controls"
            >
              <span className="scroll-hint-pill">Click video for controls • Scroll freely</span>
            </div>
          )}

          {(phase === 'checking' || phase === 'loading') && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,.72)',
                pointerEvents: 'none',
                fontSize: 13,
                letterSpacing: 0.3,
                textAlign: 'center',
                padding: 20,
              }}
            >
              {phase === 'checking'
                ? 'Checking servers (VidHindi priority)…'
                : `Loading ${active?.name}… (${autoTries}/${MAX_AUTO})`}
            </div>
          )}

          {phase === 'failed' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,.88)',
                textAlign: 'center',
                padding: 20,
              }}
            >
              <strong style={{ fontSize: 15 }}>No working server</strong>
              <span style={{ fontSize: 12, opacity: 0.72, maxWidth: 340 }}>
                If the title has not been released yet, no source will work. Otherwise retry or pick another server below.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="srv-btn" onClick={retryAll}>Retry</button>
                <button type="button" className="srv-btn" onClick={nextSource}>Next server</button>
              </div>
            </div>
          )}
        </div>

        {/* All Servers & Tools Visible Right Below Player */}
        <div className="player-toolbar">
          <div className="server-group">
            <span className="server-label">Servers:</span>
            {ordered.map((s) => {
              const st = probe[s.name];
              const bad = st === 'fail' || (st !== 'ok' && deadList.includes(s.name));
              const good = st === 'ok';
              const isActive = s.name === activeName;

              const style = isActive
                ? undefined
                : bad
                ? { opacity: 0.34, filter: 'grayscale(1)', borderColor: '#3a3a44' }
                : good
                ? { borderColor: '#2f9e5f', color: '#8fe3b0' }
                : undefined;

              return (
                <button
                  key={s.name}
                  type="button"
                  className={`srv-btn ${isActive ? 'on' : ''}`}
                  onClick={() => pickServer(s.name)}
                  style={style}
                  title={bad ? 'Not responding' : s.hint}
                >
                  <span>{s.name}</span>
                  <span className="srv-hint">{s.hint}</span>
                </button>
              );
            })}
            <button type="button" className="srv-btn" onClick={nextSource}>
              <ChevronRightIcon size={15} /> Next
            </button>
          </div>

          <div className="tool-actions">
            {item.type === 'tv' && (
              <>
                <button type="button" className="srv-btn" onClick={goPrevEp}>
                  <ChevronLeftIcon size={15} /> Prev
                </button>
                <button type="button" className="srv-btn" onClick={goNextEp}>
                  Next <ChevronRightIcon size={15} />
                </button>
              </>
            )}

            {item.trailer && (
              <button type="button" className="srv-btn" onClick={() => setShowTrailer(true)}>
                <FilmIcon size={15} /> Trailer
              </button>
            )}

            <button
              type="button"
              className={`srv-btn ${theater ? 'on' : ''}`}
              onClick={() => setTheater((v) => !v)}
            >
              <MoonIcon size={15} /> {theater ? 'Exit Theater' : 'Theater Mode'}
            </button>

            <button
              type="button"
              className={`srv-btn ${saved ? 'on' : ''}`}
              onClick={() => toggleWatchlist(item)}
            >
              {saved ? <CheckIcon size={15} /> : <PlusIcon size={15} />}
              {saved ? 'Saved' : 'Watchlist'}
            </button>

            <button type="button" className="srv-btn" onClick={handleShare}>
              <ShareIcon size={15} /> Share
            </button>
          </div>
        </div>

        <p className="player-tip">
          {item.type === 'tv' ? `Currently watching Season ${season}, Episode ${ep}. ` : ''}
          VidHindi plays first automatically when available. If a stream buffers, switch servers above.
        </p>

        {item.type === 'tv' && (
          <div className="ep-panel">
            <div className="ep-header">
              {seasons.length <= 6 ? (
                <div className="season-pills">
                  {seasons.map((sObj) => (
                    <button
                      key={sObj.s}
                      type="button"
                      className={`srv-btn ${sObj.s === season ? 'on' : ''}`}
                      onClick={() => selectSeason(sObj.s)}
                    >
                      Season {sObj.s}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  className="season-select"
                  value={season}
                  onChange={(e) => selectSeason(Number(e.target.value))}
                  aria-label="Select season"
                >
                  {seasons.map((sObj) => (
                    <option key={sObj.s} value={sObj.s}>
                      Season {sObj.s} ({sObj.eps} Episodes)
                    </option>
                  ))}
                </select>
              )}

              {totalPages > 1 && (
                <div className="season-pills">
                  {Array.from({ length: totalPages }, (_, pIdx) => {
                    const st = pIdx * EP_PAGE_SIZE + 1;
                    const en = Math.min(totalEps, (pIdx + 1) * EP_PAGE_SIZE);
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        className={`srv-btn ${pIdx === epPage ? 'on' : ''}`}
                        onClick={() => setEpPage(pIdx)}
                      >
                        {st}–{en}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ep-grid">
              {epNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`ep-btn ${num === ep ? 'on' : ''}`}
                  onClick={() => selectEpisode(num)}
                >
                  Ep {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTrailer && item.trailer && (
        <div className="modal-overlay" onClick={() => setShowTrailer(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>{item.title} — Official Trailer</strong>
              <button type="button" className="modal-close" onClick={() => setShowTrailer(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-video">
              <iframe
                src={`https://www.youtube.com/embed/${item.trailer}?autoplay=1`}
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
