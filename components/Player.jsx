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

/* tier 1 = টেস্ট করা লাইভ, 2 = ভালো ফলব্যাক */
const SERVERS = [
  { name: 'Nexus', hint: 'HD', tier: 1, m: `${NX}/movie/{tmdb}?lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?lang=en&autoplay=true&sub=en` },
  { name: 'Nitro', hint: 'Multi', tier: 1, m: `${NX}/movie/{tmdb}?server=nitro&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=nitro&lang=en&autoplay=true&sub=en` },
  { name: 'Mahalala', hint: 'Multi', tier: 1, m: `${NX}/movie/{tmdb}?server=mahalala&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=mahalala&lang=en&autoplay=true&sub=en` },
  { name: 'CastVid', hint: 'Multi', tier: 1, m: `${NX}/movie/{tmdb}?server=castvid&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=castvid&lang=en&autoplay=true&sub=en` },
  { name: 'VidBo', hint: 'Multi', tier: 1, m: `${NX}/movie/{tmdb}?server=vidbo&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=vidbo&lang=en&autoplay=true&sub=en` },
  { name: 'StremFx', hint: 'Alt', tier: 1, m: `${NX}/movie/{tmdb}?server=stremfx&lang=en&autoplay=true&sub=en`, t: `${NX}/tv/{tmdb}/{s}/{e}?server=stremfx&lang=en&autoplay=true&sub=en` },
  { name: 'Astra', hint: 'Multi', tier: 2, m: 'https://player-4aq.pages.dev/embed/movie/{tmdb}?autoPlay=true', t: 'https://player-4aq.pages.dev/embed/tv/{tmdb}/{s}/{e}?autoPlay=true' },
  { name: 'VidSrc', hint: 'HD', tier: 2, m: 'https://vidsrc.sh/embed/movie/{tmdb}', t: 'https://vidsrc.sh/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'SuperEmbed', hint: 'Multi', tier: 2, m: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1', t: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1&s={s}&e={e}' },
  { name: 'VidLink', hint: '1080p', tier: 2, m: 'https://vidlink.pro/movie/{tmdb}', t: 'https://vidlink.pro/tv/{tmdb}/{s}/{e}' },
  { name: 'Videasy', hint: 'Fast', tier: 2, m: 'https://player.videasy.net/movie/{tmdb}', t: 'https://player.videasy.net/tv/{tmdb}/{s}/{e}' },
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
  } catch {
    /* ignore */
  }
}

/* নেটওয়ার্ক-লেভেল প্রি-ফ্লাইট: DNS/কানেকশন ফেইল ধরবে */
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

  const list = useMemo(() => {
    const extra = (servers || [])
      .filter((s) => s && (s.tpl || s.m))
      .map((s) => ({
        name: s.name || 'Custom',
        hint: s.hint || '',
        tier: 0,
        m: s.m || s.tpl,
        t: s.t || s.tpl,
      }));

    const base = SERVERS.map((s) => ({
      name: s.name,
      hint: s.hint,
      tier: s.tier,
      tpl: item.type === 'tv' ? s.t : s.m,
    })).filter((s) => Boolean(s.tpl));

    const merged = [...extra.map((e) => ({ ...e, tpl: item.type === 'tv' ? e.t : e.m })), ...base];
    const seen = new Set();
    const unique = merged.filter((s) => {
      if (!s.tpl || seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });

    const dead = readDead();
    return unique.sort((a, b) => {
      const aD = dead.includes(a.name) ? 1 : 0;
      const bD = dead.includes(b.name) ? 1 : 0;
      if (aD !== bD) return aD - bD;
      return a.tier - b.tier;
    });
  }, [servers, item.type]);

  const [activeName, setActiveName] = useState('');
  const [phase, setPhase] = useState('checking'); // checking | loading | ok | failed
  const [probe, setProbe] = useState({});
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

  const active = list.find((s) => s.name === activeName) || null;

  const markDead = useCallback((name) => {
    if (!name) return;
    const d = readDead();
    if (!d.includes(name)) writeDead([...d, name]);
  }, []);

  const markAlive = useCallback((name) => {
    if (!name) return;
    const d = readDead();
    if (d.includes(name)) writeDead(d.filter((x) => x !== name));
  }, []);

  useEffect(() => {
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

  /* সব সার্ভার একসাথে প্যারালাল চেক, তারপর যেটা কাজ করছে সেটা বাছা */
  useEffect(() => {
    runRef.current += 1;
    const run = runRef.current;
    autoRef.current = 0;
    setAutoTries(0);
    setActiveName('');
    setPhase('checking');
    setProbe({});

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        list.map(async (s) => ({ name: s.name, ok: await preflight(fill(s.tpl, item.tmdb, season, ep)) }))
      );
      if (cancelled || run !== runRef.current) return;

      const map = {};
      results.forEach((r) => {
        map[r.name] = r.ok ? 'ok' : 'fail';
        if (!r.ok) markDead(r.name);
        else markAlive(r.name);
      });
      setProbe(map);

      const good = results.filter((r) => r.ok).map((r) => r.name);
      const deadNow = readDead();
      const firstGood = good.find((n) => !deadNow.includes(n)) || good[0];
      const target = firstGood || list[0]?.name || '';

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
  }, [item.tmdb, season, ep, list, markDead, markAlive]);

  const currentUrl = useMemo(() => {
    if (!active) return '';
    return fill(active.tpl, item.tmdb, season, ep);
  }, [active, item.tmdb, season, ep]);

  /* iframe লোড না হলে অটো পরের সার্ভার */
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!currentUrl || !activeName) return;

    setPhase((p) => (p === 'checking' ? p : 'loading'));

    timerRef.current = setTimeout(() => {
      markDead(activeName);
      setProbe((p) => ({ ...p, [activeName]: 'fail' }));

      const curIdx = list.findIndex((s) => s.name === activeName);
      const deadNow = readDead();
      const next = list.slice(curIdx + 1).find((s) => s.name !== activeName && !deadNow.includes(s.name));

      if (next && autoRef.current < MAX_AUTO) {
        autoRef.current += 1;
        setAutoTries(autoRef.current);
        setActiveName(next.name);
      } else {
        setPhase('failed');
      }
    }, LOAD_TIMEOUT);

    return () => clearTimeout(timerRef.current);
  }, [currentUrl, activeName, list, markDead]);

  const pickServer = (name) => {
    autoRef.current = 0;
    setAutoTries(0);
    setActiveName(name);
    setPhase('loading');
  };

  const nextSource = () => {
    const curIdx = list.findIndex((s) => s.name === activeName);
    const next = list.slice(curIdx + 1).find((s) => s.name !== activeName);
    if (next) pickServer(next.name);
    else showToast('শেষ সার্ভার — উপরের তালিকা থেকে বেছে নিন');
  };

  const retryAll = () => {
    writeDead([]);
    autoRef.current = 0;
    setAutoTries(0);
    const first = list[0]?.name;
    if (first) {
      setActiveName(first === activeName ? list[1]?.name || first : first);
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
    if (ep > 1) {
      selectEpisode(ep - 1);
    } else {
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
    if (ep < totalEps) {
      selectEpisode(ep + 1);
    } else {
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
    } catch {
      /* ignore */
    }
  };

  const deadList = typeof window !== 'undefined' ? readDead() : [];

  return (
    <>
      {theater && <div className="theater-backdrop" onClick={() => setTheater(false)} />}

      <div className={`player-shell ${theater ? 'theater' : ''}`}>
        <div className="player-frame-wrap" style={{ position: 'relative' }}>
          {currentUrl ? (
            <iframe
              key={currentUrl}
              src={currentUrl}
              allowFullScreen
              referrerPolicy="origin"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              title={item.title}
              onLoad={() => {
                markAlive(activeName);
                setProbe((p) => ({ ...p, [activeName]: 'ok' }));
                setPhase('ok');
              }}
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
                ? 'সার্ভার চেক করা হচ্ছে…'
                : `${active?.name} লোড হচ্ছে… (${autoTries}/${MAX_AUTO})`}
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
              <strong style={{ fontSize: 15 }}>কোনো সার্ভার কাজ করছে না</strong>
              <span style={{ fontSize: 12, opacity: 0.72, maxWidth: 340 }}>
                মুভিটি রিলিজ না হয়ে থাকলে এখনো কোথাও পাওয়া যাবে না। নাহলে আবার চেষ্টা করুন বা নিচের তালিকা থেকে অন্যটা বেছে নিন।
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="srv-btn" onClick={retryAll}>
                  আবার চেষ্টা
                </button>
                <button type="button" className="srv-btn" onClick={nextSource}>
                  পরের সার্ভার
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="player-toolbar">
          <div className="server-group">
            <span className="server-label">Servers:</span>
            {list.map((s) => {
              const st = probe[s.name];
              const dim = st === 'fail' || deadList.includes(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  className={`srv-btn ${s.name === activeName ? 'on' : ''}`}
                  onClick={() => pickServer(s.name)}
                  style={dim && s.name !== activeName ? { opacity: 0.4 } : undefined}
                  title={st === 'fail' ? 'এই সার্ভার সাড়া দিচ্ছে না' : s.hint}
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
          If the player fails to load or buffers, switch to another server above.
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
