'use client';

const WATCHLIST_KEY = 'myflix_watchlist_v1';
const HISTORY_KEY = 'myflix_history_v1';
const STORAGE_EVENT = 'myflix:storage';
const TOAST_EVENT = 'myflix:toast';

function safeParse(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeWrite(key, data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // ignore quota errors
  }
}

export function showToast(message) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function slimItem(m) {
  return {
    id: m.id,
    tmdb: m.tmdb,
    type: m.type,
    title: m.title,
    slug: m.slug,
    year: m.year,
    poster: m.poster || '',
    backdrop: m.backdrop || '',
    rating: m.rating || 0,
    lang: m.lang || 'en',
  };
}

export function getWatchlist() {
  return safeParse(WATCHLIST_KEY);
}

export function isInWatchlist(id) {
  return getWatchlist().some((x) => x.id === id);
}

export function toggleWatchlist(item) {
  const list = getWatchlist();
  const exists = list.some((x) => x.id === item.id);
  const next = exists
    ? list.filter((x) => x.id !== item.id)
    : [{ ...slimItem(item), savedAt: Date.now() }, ...list].slice(0, 120);
  safeWrite(WATCHLIST_KEY, next);
  showToast(exists ? 'Removed from Watchlist' : 'Added to Watchlist');
  return !exists;
}

export function clearWatchlist() {
  safeWrite(WATCHLIST_KEY, []);
  showToast('Watchlist cleared');
}

export function getHistory() {
  return safeParse(HISTORY_KEY);
}

export function saveToHistory(item, s = null, e = null) {
  const list = getHistory().filter((x) => x.id !== item.id);
  const entry = {
    ...slimItem(item),
    s,
    e,
    watchedAt: Date.now(),
  };
  safeWrite(HISTORY_KEY, [entry, ...list].slice(0, 30));
}

export function removeFromHistory(id) {
  const next = getHistory().filter((x) => x.id !== id);
  safeWrite(HISTORY_KEY, next);
}

export function clearHistory() {
  safeWrite(HISTORY_KEY, []);
  showToast('Watch history cleared');
}

export function subscribeStorage(cb) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export { TOAST_EVENT };
