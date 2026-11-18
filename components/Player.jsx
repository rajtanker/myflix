jsx
'use client';
import { useEffect, useMemo, useState } from 'react';
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

export default function Player({ item, servers = [] }) {
  const seasons = useMemo(() => {
    if (item.type !== 'tv') return [];
    if (Array.isArray(item.seasonList) && item.seasonList.length > 0) {
      return item.seasonList;
    }
    return [{ s: 1, eps: 12 }];
  }, [item]);

  const [srv, setSrv] = useState(0);
  const [season, setSeason] = useState(seasons[0]?.s || 1);
  const [ep, setEp] = useState(1);
  const [epPage, setEpPage] = useState(0);
  const [theater, setTheater] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [saved, setSaved] = useState(false);

  // Restore episode from URL hash (#s2e4) if present
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

  // Auto-save to Continue Watching history
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
    const tpl = servers[srv]?.tpl || '';
    return tpl
      .replace('{tmdb}', String(item.tmdb))
      .replace('{s}', String(season))
      .replace('{e}', String(ep));
  }, [servers, srv, item.tmdb, season, ep]);

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
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      }
    } catch {
      // ignore cancel
    }
  };

  return (
    <>
      {theater && <div className="theater-backdrop" onClick={() => setTheater(false)} />}

      <div className={`player-shell ${theater ? 'theater' : ''}`}>
        <div className="player-frame-wrap">
          <iframe
            key={currentUrl}
            src={currentUrl}
            allowFullScreen
            referrerPolicy="origin"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            title={item.title}
          />
        </div>

        <div className="player-toolbar">
          <div className="server-group">
            <span className="server-label">Servers:</span>
            {servers.map((s, i) => (
              <button
                key={s.name}
                type="button"
                className={`srv-btn ${i === srv ? 'on' : ''}`}
                onClick={() => setSrv(i)}
              >
                <span>{s.name}</span>
                <span className="srv-hint">{s.hint}</span>
              </button>
            ))}
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
