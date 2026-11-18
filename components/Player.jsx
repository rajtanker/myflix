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
const LOAD_TIMEOUT = 8000; // ms — এর মধ্যে লোড না হলে ডেড ধরে পরেরটায়
const MAX_AUTO = 5; // সর্বোচ্চ কতবার নিজে নিজে বদলাবে
const DEAD_KEY = 'myflix.deadservers';

/* tier 1 = যাচাই করা সেরা, 2 = ভালো, 3 = ফলব্যাক, 4 = পুরনো/অনিশ্চিত */
const SERVERS = [
  { name: 'VidSrc', hint: 'HD', tier: 1, m: 'https://vidsrc.sh/embed/movie/{tmdb}', t: 'https://vidsrc.sh/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'VidSrc 2', hint: 'Mirror', tier: 1, m: 'https://vidsrc2.ru/embed/movie/{tmdb}', t: 'https://vidsrc2.ru/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'VidSrc IR', hint: 'Mirror', tier: 1, m: 'https://vidsrc.ir/embed/movie/{tmdb}', t: 'https://vidsrc.ir/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'SuperEmbed', hint: 'Multi', tier: 1, m: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1', t: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1&s={s}&e={e}' },
  { name: 'SuperEmbed VIP', hint: 'Fast', tier: 1, m: 'https://multiembed.mov/directstream.php?video_id={tmdb}&tmdb=1', t: 'https://multiembed.mov/directstream.php?video_id={tmdb}&tmdb=1&s={s}&e={e}' },
  { name: 'VidLink', hint: '1080p', tier: 2, m: 'https://vidlink.pro/movie/{tmdb}', t: 'https://vidlink.pro/tv/{tmdb}/{s}/{e}' },
  { name: '2Embed', hint: 'Classic', tier: 2, m: 'https://2embed.cc/embed/{tmdb}', t: 'https://2embed.cc/embedtv/{tmdb}&s={s}&e={e}' },
  { name: 'Videasy', hint: 'Fast', tier: 2, m: 'https://player.videasy.net/movie/{tmdb}', t: 'https://player.videasy.net/tv/{tmdb}/{s}/{e}' },
  { name: 'EmbedSU', hint: 'HD', tier: 3, m: 'https://embed.su/embed/movie/{tmdb}', t: 'https://embed.su/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'MoviesAPI', hint: 'Alt', tier: 3, m: 'https://moviesapi.club/movie/{tmdb}', t: 'https://moviesapi.club/tv/{tmdb}-{s}-{e}' },
  { name: 'VidFast', hint: 'Alt', tier: 3, m: 'https://vidfast.pro/movie/{tmdb}', t: 'https://vidfast.pro/tv/{tmdb}/{s}/{e}' },
  { name: 'Smashy', hint: 'Alt', tier: 3, m: 'https://player.smashy.stream/movie/{tmdb}', t: 'https://player.smashy.stream/tv/{tmdb}?s={s}&e={e}' },
  { name: '111Movies', hint: 'Alt', tier: 3, m: 'https://111movies.com/movie/{tmdb}', t: 'https://111movies.com/tv/{tmdb}/{s}/{e}' },
  { name: 'VidSrc PRO', hint: 'Alt', tier: 3, m: 'https://vidsrc.pro/embed/movie/{tmdb}', t: 'https://vidsrc.pro/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'VidSrc ME', hint: 'Old', tier: 4, m: 'https://vidsrc.me/embed/movie?tmdb={tmdb}', t: 'https://vidsrc.me/embed/tv?tmdb={tmdb}&season={s}&episode={e}' },
  { name: 'VidSrc Embed', hint: 'Old', tier: 4, m: 'https://vidsrc-embed.ru/embed/movie/{tmdb}', t: 'https://vidsrc-embed.ru/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'VixSrc', hint: 'Alt', tier: 4, m: 'https://vixsrc.to/movie/{tmdb}', t: 'https://vixsrc.to/tv/{tmdb}/{s}/{e}' },
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

export default function Player({ item, servers = [] }) {
  const seasons = useMemo(() => {
    if (item.type !== 'tv') return [];
    if (Array.isArray(item.seasonList) && item.seasonList.length > 0) {
      return item.seasonList;
    }
    return [{ s: 1, eps: 12 }];
  }, [item]);

  /* প্রপ থেকে আসা সার্ভার tier 0 হিসেবে যোগ হয়, ডুপ্লিকেট বাদ */
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

  const [activeName, setActiveName] = useState(list[0]?.name || '');
  const [phase, setPhase] = useState('loading'); // loading | ok | failed
  const [autoTries, setAutoTries] = useState(0);
  const [season, setSeason] = useState(seasons[0]?.s || 1);
  const [ep, setEp] = useState(1);
  const [epPage, setEpPage] = useState(0);
  const [theater, setTheater] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [saved, setSaved] = useState(false);

  const timerRef = useRef(null);
  const autoRef = useRef(0);

  const active = list.find((s) => s.name === activeName) || list[0];

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

  /* URL hash থেকে এপিসোড রিস্টোর */
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
    if (item.type === 'tv') {
      saveToHistory(item, season, ep);
    } else {
      saveToHistory(item);
    }
  }, [item, season, ep]);

  const activeSeasonObj = seasons.find((x) => x.s === season) || seasons[0] || { s: 1, eps: 1 };
  const totalEps = activeSeasonObj.eps || 1;
  const totalPages = Math.ceil(totalEps / EP_PAGE_SIZE);
  const pageStart = epPage * EP_PAGE_SIZE + 1;
  const pageEnd = Math.min(totalEps, (epPage + 1) * EP_PAGE_SIZE);
  const epNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  const currentUrl = useMemo(() => {
    const tpl = active?.tpl || '';
    return tpl
      .replace('{tmdb}', String(item.tmdb))
      .replace('{s}', String(season))
      .replace('{e}', String(ep));
  }, [active, item.tmdb, season, ep]);

  /* অটো-ফেইলওভার টাইমার */
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!currentUrl) return;

    setPhase('loading');
    timerRef.current = setTimeout(() => {
      markDead(activeName);

      const curIdx = list.findIndex((s) => s.name === activeName);
      const next = list.slice(curIdx + 1).find((s) => s.name !== activeName);

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
  };

  const nextSource = () => {
    const curIdx = list.findIndex((s) => s.name === activeName);
    const next = list.slice(curIdx + 1).find((s) => s.name !== activeName);
    if (next) {
      pickServer(next.name);
    } else {
      showToast('শেষ সার্ভার — উপরের তালিকা থেকে বেছে নিন');
    }
  };

  const retryAll = () => {
    writeDead([]);
    autoRef.current = 0;
    setAutoTries(0);
    setPhase('loading');
    const first = list[0]?.name;
    if (first) setActiveName(first === activeName ? list[1]?.name || first : first);
  };

  const selectSeason = (sNum) => {
    setSeason(sNum);
    setEp(1);
    setEpPage(0);
    autoRef.current = 0;
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
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      }
    } catch {
      /* ignore cancel */
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
                setPhase('ok');
              }}
            />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', opacity: 0.7 }}>
              এই টাইটেলের জন্য কোনো সার্ভার পাওয়া যায়নি।
            </div>
          )}

          {phase === 'loading' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,.55)',
                pointerEvents: 'none',
                fontSize: 13,
                letterSpacing: 0.3,
              }}
            >
              {active?.name} লোড হচ্ছে… ({autoTries}/{MAX_AUTO})
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
                background: 'rgba(0,0,0,.85)',
                textAlign: 'center',
                padding: 20,
              }}
            >
              <strong style={{ fontSize: 15 }}>সব সার্ভার ব্যর্থ হয়েছে</strong>
              <span style={{ fontSize: 12, opacity: 0.7, maxWidth: 340 }}>
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
            {list.map((s) => (
              <button
                key={s.name}
                type="button"
                className={`srv-btn ${s.name === activeName ? 'on' : ''}`}
                onClick={() => pickServer(s.name)}
                style={deadList.includes(s.name) ? { opacity: 0.45 } : undefined}
                title={deadList.includes(s.name) ? 'এই সেশনে ব্যর্থ হয়েছে' : s.hint}
              >
                <span>{s.name}</span>
                <span className="srv-hint">{s.hint}</span>
              </button>
            ))}
            <button type="button" className="srv-btn" onClick={nextSource}>
              <ChevronRightIcon size={15} /> Next source
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
          {item.type === 'tv'
            ? `Currently watching Season ${season}, Episode ${ep}. `
            : ''}
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
