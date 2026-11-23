'use client';

const WATCHLIST_KEY = 'myflix_watchlist_v1';
const HISTORY_KEY = 'myflix_history_v1';
const INTERESTS_KEY = 'myflix_interests_v1';
const REVIEWS_KEY = 'myflix_user_reviews_v1';
const STORAGE_EVENT = 'myflix:storage';
const TOAST_EVENT = 'myflix:toast';

function safeParse(key, fallback = []) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {}
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
    genres: m.genres || [],
  };
}

export function getWatchlist() {
  const arr = safeParse(WATCHLIST_KEY, []);
  return Array.isArray(arr) ? arr : [];
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
  const arr = safeParse(HISTORY_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveToHistory(item, s = null, e = null) {
  const list = getHistory().filter((x) => x.id !== item.id);
  const entry = { ...slimItem(item), s, e, watchedAt: Date.now() };
  safeWrite(HISTORY_KEY, [entry, ...list].slice(0, 30));
}

export function removeFromHistory(id) {
  safeWrite(HISTORY_KEY, getHistory().filter((x) => x.id !== id));
}

export function clearHistory() {
  safeWrite(HISTORY_KEY, []);
  showToast('Watch history cleared');
}

export function getInterests() {
  const def = { genres: [], langs: [] };
  const obj = safeParse(INTERESTS_KEY, def);
  return {
    genres: Array.isArray(obj?.genres) ? obj.genres : [],
    langs: Array.isArray(obj?.langs) ? obj.langs : [],
  };
}

export function saveInterests(next) {
  safeWrite(INTERESTS_KEY, next);
  showToast('Personalization updated!');
}

export function getUserReviews(movieId) {
  const map = safeParse(REVIEWS_KEY, {});
  return Array.isArray(map?.[movieId]) ? map[movieId] : [];
}

export function addUserReview(movieId, review) {
  const map = safeParse(REVIEWS_KEY, {});
  const prev = Array.isArray(map?.[movieId]) ? map[movieId] : [];
  const next = {
    ...map,
    [movieId]: [{ ...review, createdAt: new Date().toISOString().slice(0, 10) }, ...prev].slice(0, 20),
  };
  safeWrite(REVIEWS_KEY, next);
  showToast('Review published!');
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
