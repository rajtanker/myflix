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
const SPEED_KEY = 'myflix.serverspeed.v1';

const NX = 'https://nxsha.space/embed';
const NXQ = '?lang=en&autoplay=true&sub=en';

const SERVERS = [
  { name: 'VidLink Pro', hint: '1080p', m: 'https://vidlink.pro/movie/{tmdb}', t: 'https://vidlink.pro/tv/{tmdb}/{s}/{e}' },
  { name: 'Nexus HD', hint: 'HD', m: `${NX}/movie/{tmdb}${NXQ}`, t: `${NX}/tv/{tmdb}/{s}/{e}${NXQ}` },
  { name: 'VidHindi', hint: 'Hindi', m: `${NX}/movie/{tmdb}?server=vidhindi&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=vidhindi&lang=en&autoplay=true&sub=en` },
  { name: 'Nitro Multi', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=nitro&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=nitro&lang=en&autoplay=true&sub=en` },
  { name: 'MultiEmbed Mirror', hint: 'Multi', m: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1', t: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1&s={s}&e={e}' },
  { name: 'VidSrc', hint: 'HD', m: 'https://vidsrc.sh/embed/movie/{tmdb}', t: 'https://vidsrc.sh/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'Mahalala Multi', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=mahalala&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=mahalala&lang=en&autoplay=true&sub=en` },
  { name: 'CastVid Multi', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=castvid&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=castvid&lang=en&autoplay=true&sub=en` },
  { name: 'VidBo', hint: 'Multi', m: `${NX}/movie/{tmdb}?server=vidbo&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=vidbo&lang=en&autoplay=true&sub=en` },
  { name: 'StremFx', hint: 'Alt', m: `${NX}/movie/{tmdb}?server=stremfx&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=stremfx&lang=en&autoplay=true&sub=en` },
];

const BLOCKED_NAMES = new Set([
  'Astra',
  'VidSrc CC',
  'Embed.su',
  'AutoEmbed',
  'VidSrc XYZ',
]);

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

function readSpeeds() {
  if (typeof window === 'undefined') return {};
  try {
    const obj = JSON.parse(localStorage.getItem(SPEED_KEY) || '{}');
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function saveSpeed(name, ms) {
  if (typeof window === 'undefined' || !name) return;
  try {
    const cur = readSpeeds();
    const prev = typeof cur[name] === 'number' ? cur[name] : ms;
    cur[name] = Math.round(prev * 0.4 + ms * 0.6);
    localStorage.setItem(SPEED_KEY, JSON.stringify(cur));
  } catch {}
}

function preflight(url) {
  return new Promise((resolve) => {
    let done = false;
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      ctrl.abort();
      resolve({ ok: false, ms: 99999 });
    }, PROBE_TIMEOUT);

    fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
      .then(() => {
        if (done) return;
        done = true;
        clearTimeout(t);
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        resolve({ ok: true, ms: Math.max(10, Math.round(now - t0)) });
      })
      .catch(() => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve({ ok: false, ms: 99999 });
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

  const list = useMemo(() => {
    const base = SERVERS.map((s) => ({
      name: s.name,
      hint: s.hint,
      tpl: item.type === 'tv' ? s.t : s.m,
    })).filter((s) => Boolean(s.tpl));

    const extra = (servers || [])
      .filter((s) => s && !BLOCKED_NAMES.has(s.name) && (s.tpl || s.m))
      .map((s) => ({
        name: s.name || 'Custom',
        hint: s.hint || '',
        tpl: item.type === 'tv' ? (s.t || s.tpl) : (s.m || s.tpl),
      }))
      .filter((s) => Boolean(s.tpl));

    const merged = [...base, ...extra];
    const seen = new Set();
    return merged.filter((s) => {
      if (!s.tpl || BLOCKED_NAMES.has(s.name) || seen.has(s.name)) return false;
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
  const [speedMap, setSpeedMap] = useState({});
  const [deadList, setDeadList] = useState([]);
  const [autoTries, setAutoTries] = useState(0);
  const [season, setSeason] = useState(seasons[0]?.s || 1);
  const [ep, setEp] = useState(1);
  const [epPage, setEpPage] = useState(0);
  const [theater, setTheater] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [saved, setSaved] = useState(false);

  const timerRef = useRef(null);
  const autoRef = useRef(0);
  const runRef = useRef(0);
  const loadedRef = useRef(false);
  const iframeStartRef = useRef(0);

  const active = list.find((s) => s.name === activeName) || null;

  /* Dynamic speed ranking: fastest working servers first, VidHindi pinned at 2nd or 3rd if alive (hidden if failed) */
  const ordered = useMemo(() => {
    const visible = list.filter((s) => {
      if (s.name === 'VidHindi') {
        const st = probe['VidHindi']?.status;
        if (st === 'fail' || (st !== 'ok' && deadList.includes('VidHindi'))) return false;
      }
      return true;
    });

    const rankScore = (s) => {
      const p = probe[s.name];
      const hist = speedMap[s.name];
      if (p?.status === 'fail' || (p?.status !== 'ok' && deadList.includes(s.name))) {
        return 1000000;
      }
      if (p?.status === 'ok') {
        return (p.ms || 500) + (typeof hist === 'number' ? hist * 0.35 : 0);
      }
      return typeof hist === 'number' ? 50000 + hist : 80000;
    };

    const others = visible.filter((s) => s.name !== 'VidHindi').sort((a, b) => rankScore(a) - rankScore(b));
    const vidHindi = visible.find((s) => s.name === 'VidHindi');

    if (!vidHindi) return others;

    // Keep VidHindi strictly in 2nd or 3rd slot when working/available
    const vhIdx = others.length >= 2 ? 2 : others.length >= 1 ? 1 : 0;
    const out = [...others];
    out.splice(vhIdx, 0, vidHindi);
    return out;
  }, [list, probe, speedMap, deadList]);

  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;

  const markDead = useCallback((name) => {
    if (!name) return;
    const d = readDead();
    if (!d.includes(name)) {
      const next = [...d, name];
      writeDead(next);
      setDeadList(next);
    }
    saveSpeed(name, 15000);
    setSpeedMap(readSpeeds());
  }, []);

  const markAlive = useCallback((name, ms = 300) => {
    if (!name) return;
    const d = readDead();
    if (d.includes(name)) {
      const next = d.filter((x) => x !== name);
      writeDead(next);
      setDeadList(next);
    }
    saveSpeed(name, ms);
    setSpeedMap(readSpeeds());
  }, []);

  useEffect(() => {
    setDeadList(readDead());
    setSpeedMap(readSpeeds());
    if (item.type === 'tv' && typeof window !== 'undefined') {
      const m = window.location.hash.match(/^#s(\d+)e(\d+)$/i);
      if (m) {
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
      document.body.style.overflow = fsEl ? 'hidden' : '';
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

  /* Fastest-First Race Probe: plays the VERY FIRST working fast server immediately! */
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
    let pickedFastest = false;
    let finishedCount = 0;
    const current = [...listRef.current];
    const deadNow = readDead();
    const savedSpeeds = readSpeeds();

    // Prioritize probing historically fastest non-dead servers first
    const probeOrder = [...current].sort((a, b) => {
      const aDead = deadNow.includes(a.name) ? 1 : 0;
      const bDead = deadNow.includes(b.name) ? 1 : 0;
      if (aDead !== bDead) return aDead - bDead;
      return (savedSpeeds[a.name] ?? 9999) - (savedSpeeds[b.name] ?? 9999);
    });

    const okList = [];

    probeOrder.forEach(async (s) => {
      const res = await preflight(fill(s.tpl, item.tmdb, season, ep));
      if (cancelled || run !== runRef.current) return;

      finishedCount += 1;
      setProbe((prev) => ({
        ...prev,
        [s.name]: { status: res.ok ? 'ok' : 'fail', ms: res.ms },
      }));

      if (res.ok) {
        markAlive(s.name, res.ms);
        okList.push({ name: s.name, ms: res.ms });

        // Immediately start the fastest non-VidHindi working server (unless only VidHindi works)
        if (!pickedFastest && s.name !== 'VidHindi' && !deadNow.includes(s.name)) {
          pickedFastest = true;
          setActiveName(s.name);
          setPhase('loading');
        }
      } else {
        markDead(s.name);
      }

      // If all finished and nothing picked yet (e.g. only VidHindi succeeded or all blocked CORS)
      if (finishedCount === probeOrder.length && !pickedFastest) {
        const fallbackTarget =
          okList.sort((a, b) => a.ms - b.ms)[0]?.name ||
          current.find((x) => x.name !== 'VidHindi' && !deadNow.includes(x.name))?.name ||
          current[0]?.name ||
          '';

        if (!fallbackTarget) {
          setPhase('failed');
        } else {
          pickedFastest = true;
          setActiveName(fallbackTarget);
          setPhase('loading');
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [item.tmdb, season, ep, listKey, markDead, markAlive]);

  const currentUrl = useMemo(() => {
    if (!active) return '';
    return fill(active.tpl, item.tmdb, season, ep);
  }, [active, item.tmdb, season, ep]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!currentUrl || !activeName) return;
    if (loadedRef.current) return;

    iframeStartRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setPhase((p) => (p === 'checking' ? p : 'loading'));

    timerRef.current = setTimeout(() => {
      if (loadedRef.current) return;

      markDead(activeName);
      setProbe((p) => ({ ...p, [activeName]: { status: 'fail', ms: 99999 } }));

      const deadNow = readDead();
      const next = orderedRef.current.find((s) => s.name !== activeName && !deadNow.includes(s.name));

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
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const loadMs = Math.max(50, Math.round(now - (iframeStartRef.current || now)));
    markAlive(activeName, loadMs);
    setProbe((p) => ({ ...p, [activeName]: { status: 'ok', ms: p[activeName]?.ms || loadMs } }));
    setPhase('ok');
  };

  const pickServer = (name) => {
    autoRef.current = 0;
    loadedRef.current = false;
    setAutoTries(0);
    setActiveName(name);
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

  const jumpTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {theater && <div className="theater-backdrop" onClick={() => setTheater(false)} />}

      <div className={`player-shell cinema-stage ${theater ? 'theater' : ''}`}>
        <div className="player-frame-wrap" style={{ position: 'relative' }}>
          {currentUrl ? (
            <iframe
              key={currentUrl}
              src={currentUrl}
              allowFullScreen
              referrerPolicy="origin"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              title={item.title}
              onLoad={handleLoaded}
            />
          ) : null}

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
                ? 'Finding fastest server…'
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

        <div className="player-toolbar">
          <div className="server-group">
            <span className="server-label">Fastest Servers:</span>
            {ordered.map((s) => {
              const p = probe[s.name];
              const st = p?.status;
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
                  title={bad ? 'Not responding' : `${s.hint}${good && p.ms < 9000 ? ` (${p.ms}ms)` : ''}`}
                >
                  <span>{s.name}</span>
                  <span className="srv-hint">{good && p.ms < 9000 ? `${p.ms}ms` : s.hint}</span>
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

            <button type="button" className="srv-btn" onClick={() => jumpTo('.detail-grid')}>
              Details ↓
            </button>
            <button type="button" className="srv-btn" onClick={() => jumpTo('.reviews-sec')}>
              Reviews ↓
            </button>
          </div>
        </div>

        <p className="player-tip">
          {item.type === 'tv' ? `Currently watching Season ${season}, Episode ${ep}. ` : ''}
          Fastest responding server starts automatically and servers reorder dynamically by speed.
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
