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

  const timerRef = useRef(null);
  const autoRef = useRef(0);
  const runRef = useRef(0);
  const loadedRef = useRef(false);

  const active = list.find((s) => s.name === activeName) || null;

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

  const handleLoade
