export const LANGS = [
  { code: 'en', slug: 'english', name: 'English' },
  { code: 'hi', slug: 'hindi', name: 'Hindi' },
  { code: 'ko', slug: 'korean', name: 'Korean' },
  { code: 'ja', slug: 'japanese', name: 'Japanese' },
  { code: 'es', slug: 'spanish', name: 'Spanish' },
  { code: 'fr', slug: 'french', name: 'French' },
  { code: 'bn', slug: 'bangla', name: 'Bangla' },
  { code: 'ta', slug: 'tamil', name: 'Tamil' },
  { code: 'te', slug: 'telugu', name: 'Telugu' },
  { code: 'ml', slug: 'malayalam', name: 'Malayalam' },
  { code: 'kn', slug: 'kannada', name: 'Kannada' },
  { code: 'zh', slug: 'chinese', name: 'Chinese' },
  { code: 'de', slug: 'german', name: 'German' },
  { code: 'it', slug: 'italian', name: 'Italian' },
];

export const GENRES = [
  { slug: 'action', name: 'Action' },
  { slug: 'adventure', name: 'Adventure' },
  { slug: 'animation', name: 'Animation' },
  { slug: 'comedy', name: 'Comedy' },
  { slug: 'crime', name: 'Crime' },
  { slug: 'documentary', name: 'Documentary' },
  { slug: 'drama', name: 'Drama' },
  { slug: 'family', name: 'Family' },
  { slug: 'fantasy', name: 'Fantasy' },
  { slug: 'history', name: 'History' },
  { slug: 'horror', name: 'Horror' },
  { slug: 'music', name: 'Music' },
  { slug: 'mystery', name: 'Mystery' },
  { slug: 'romance', name: 'Romance' },
  { slug: 'sci-fi', name: 'Sci-Fi' },
  { slug: 'thriller', name: 'Thriller' },
  { slug: 'war', name: 'War' },
  { slug: 'western', name: 'Western' },
];

export const TMDB_GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'Drama',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action',
  10762: 'Family',
  10763: 'Documentary',
  10764: 'Drama',
  10765: 'Sci-Fi',
  10766: 'Drama',
  10767: 'Comedy',
  10768: 'War',
};

export function langBySlug(slug) {
  return LANGS.find((l) => l.slug === slug) || null;
}

export function langByCode(code) {
  return LANGS.find((l) => l.code === code) || null;
}

export function genreBySlug(slug) {
  return GENRES.find((g) => g.slug === slug) || null;
}

export function genreNameToSlug(name) {
  const found = GENRES.find((g) => g.name.toLowerCase() === String(name).toLowerCase());
  return found ? found.slug : String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
