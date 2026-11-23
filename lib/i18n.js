'use client';
import { useEffect, useState } from 'react';

export const APP_LANGUAGES = [
  { code: 'en', name: 'English (Default)' },
  { code: 'bn', name: 'বাংলা (Bangla)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'ko', name: '한국어 (Korean)' },
];

const DICT = {
  en: {
    home: 'Home', movies: 'Movies', series: 'TV Shows', anime: 'Anime', shorts: 'Shorts',
    more: 'More', browse: 'Explore & Filter', upcoming: 'Upcoming Releases', news: 'Movie News',
    watchlist: 'Watchlist', settings: 'Settings', cinebot: 'CineBot AI', searchPh: 'Search movies, series, actors...',
    pickedForYou: 'Picked For You', addInterests: 'Add Interests', watchNow: 'Watch Now',
    trending: 'Top 10 Trending This Week', newReleases: 'New Releases', popularSeries: 'Popular TV Series',
    upcomingSec: 'Upcoming Releases', animeSec: 'Anime Universe', shortsSec: 'Movie Clips & Shorts',
    newsSec: 'Latest Cinema Buzz & News', reviews: 'Reviews & Ratings', writeReview: 'Write a Review',
    surpriseMe: 'Surprise Me!', pickMood: 'Pick Your Mood:', viewAll: 'View All',
  },
  bn: {
    home: 'হোম', movies: 'মুভি', series: 'টিভি সিরিজ', anime: 'অ্যানিমে', shorts: 'শর্টস',
    more: 'আরও', browse: 'খুঁজুন ও ফিল্টার', upcoming: 'আসন্ন মুভি', news: 'মুভি নিউজ',
    watchlist: 'ওয়াচলিস্ট', settings: 'সেটিংস', cinebot: 'সিনেবট AI', searchPh: 'মুভি, সিরিজ, নায়ক খুঁজুন...',
    pickedForYou: 'আপনার পছন্দের সাজেশন', addInterests: 'পছন্দ যোগ করুন', watchNow: 'এখনই দেখুন',
    trending: 'এই সপ্তাহের সেরা ১০ ট্রেন্ডিং', newReleases: 'নতুন রিলিজ', popularSeries: 'জনপ্রিয় টিভি সিরিজ',
    upcomingSec: 'আসন্ন রিলিজ', animeSec: 'অ্যানিমে জগৎ', shortsSec: 'মুভি ক্লিপস ও শর্টস',
    newsSec: 'সর্বশেষ মুভি নিউজ', reviews: 'রিভিউ ও রেটিং', writeReview: 'রিভিউ লিখুন',
    surpriseMe: 'সারপ্রাইজ!', pickMood: 'মুড বাছাই করুন:', viewAll: 'সব দেখুন',
  },
  hi: {
    home: 'होम', movies: 'मूवीज़', series: 'टीवी शो', anime: 'एनीमे', shorts: 'शॉर्ट्स',
    more: 'और', browse: 'खोजें और फ़िल्टर', upcoming: 'आने वाली फिल्में', news: 'मूवी न्यूज़',
    watchlist: 'वॉचलिस्ट', settings: 'सेटिंग्स', cinebot: 'सिनेबॉट AI', searchPh: 'फिल्में, शो, अभिनेता खोजें...',
    pickedForYou: 'आपके लिए खास', addInterests: 'पसंद जोड़ें', watchNow: 'अभी देखें',
    trending: 'टॉप 10 ट्रेंडिंग', newReleases: 'नई रिलीज़', popularSeries: 'पॉपुलर सीरीज़',
    upcomingSec: 'जल्द आ रही हैं', animeSec: 'एनीमे ज़ोन', shortsSec: 'मूवी क्लिप्स और शॉर्ट्स',
    newsSec: 'ताज़ा सिनेमा न्यूज़', reviews: 'रिव्यू और रेटिंग', writeReview: 'रिव्यू लिखें',
    surpriseMe: 'सरप्राइज़!', pickMood: 'अपना मूड चुनें:', viewAll: 'सभी देखें',
  },
  es: {
    home: 'Inicio', movies: 'Películas', series: 'Series', anime: 'Anime', shorts: 'Shorts',
    more: 'Más', browse: 'Explorar', upcoming: 'Próximamente', news: 'Noticias',
    watchlist: 'Mi Lista', settings: 'Ajustes', cinebot: 'CineBot IA', searchPh: 'Buscar películas, actores...',
    pickedForYou: 'Recomendado Para Ti', addInterests: 'Tus Gustos', watchNow: 'Ver Ahora',
    trending: 'Top 10 Tendencias', newReleases: 'Estrenos', popularSeries: 'Series Populares',
    upcomingSec: 'Próximos Estrenos', animeSec: 'Universo Anime', shortsSec: 'Clips y Shorts',
    newsSec: 'Noticias de Cine', reviews: 'Reseñas', writeReview: 'Escribir Reseña',
    surpriseMe: '¡Sorpréndeme!', pickMood: 'Elige tu Mood:', viewAll: 'Ver Todo',
  },
  fr: {
    home: 'Accueil', movies: 'Films', series: 'Séries', anime: 'Anime', shorts: 'Shorts',
    more: 'Plus', browse: 'Explorer', upcoming: 'À Venir', news: 'Actualités',
    watchlist: 'Ma Liste', settings: 'Paramètres', cinebot: 'CineBot IA', searchPh: 'Rechercher films, acteurs...',
    pickedForYou: 'Sélection Pour Vous', addInterests: 'Mes Goûts', watchNow: 'Regarder',
    trending: 'Top 10 Tendances', newReleases: 'Nouveautés', popularSeries: 'Séries Populaires',
    upcomingSec: 'Sorties à Venir', animeSec: 'Univers Anime', shortsSec: 'Extraits & Shorts',
    newsSec: 'Actualités Cinéma', reviews: 'Avis & Notes', writeReview: 'Donner un Avis',
    surpriseMe: 'Surprenez-moi!', pickMood: 'Votre Humeur:', viewAll: 'Voir Tout',
  },
  ar: {
    home: 'الرئيسية', movies: 'أفلام', series: 'مسلسلات', anime: 'أنمي', shorts: 'مقاطع',
    more: 'المزيد', browse: 'استكشاف', upcoming: 'قريباً', news: 'أخبار السينما',
    watchlist: 'قائمتي', settings: 'الإعدادات', cinebot: 'المساعد الذكي', searchPh: 'ابحث عن أفلام، ممثلين...',
    pickedForYou: 'مختارات لك', addInterests: 'أضف اهتماماتك', watchNow: 'شاهد الآن',
    trending: 'أفضل 10 هذا الأسبوع', newReleases: 'أحدث الإصدارات', popularSeries: 'مسلسلات شائعة',
    upcomingSec: 'قريباً في السينما', animeSec: 'عالم الأنمي', shortsSec: 'مقاطع قصيرة',
    newsSec: 'أخبار الأفلام', reviews: 'التقييمات والمراجعات', writeReview: 'اكتب مراجعة',
    surpriseMe: 'فاجئني!', pickMood: 'اختر مزاجك:', viewAll: 'عرض الكل',
  },
  ko: {
    home: '홈', movies: '영화', series: '시리즈', anime: '애니메', shorts: '쇼츠',
    more: '더보기', browse: '탐색', upcoming: '개봉 예정', news: '영화 뉴스',
    watchlist: '찜한 목록', settings: '설정', cinebot: '시네봇 AI', searchPh: '영화, 배우, 장르 검색...',
    pickedForYou: '맞춤 추천', addInterests: '관심사 추가', watchNow: '지금 보기',
    trending: '이번 주 TOP 10', newReleases: '최신 개봉작', popularSeries: '인기 시리즈',
    upcomingSec: '개봉 예정작', animeSec: '애니메이션', shortsSec: '무비 클립 & 쇼츠',
    newsSec: '최신 영화 소식', reviews: '리뷰 및 평점', writeReview: '리뷰 작성',
    surpriseMe: '랜덤 추천!', pickMood: '오늘의 기분:', viewAll: '전체 보기',
  },
};

const LANG_KEY = 'myflix_app_lang_v1';
const PREFS_KEY = 'myflix_prefs_v1';
const PREFS_EVENT = 'myflix:prefs';

export function getAppLang() {
  if (typeof window === 'undefined') return 'en';
  return window.localStorage.getItem(LANG_KEY) || 'en';
}

export function setAppLang(code) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LANG_KEY, code);
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export function getPrefs() {
  const def = { hoverPreview: true };
  if (typeof window === 'undefined') return def;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...def, ...JSON.parse(raw) } : def;
  } catch {
    return def;
  }
}

export function setPrefs(next) {
  if (typeof window === 'undefined') return;
  const merged = { ...getPrefs(), ...next };
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export function useI18n() {
  const [lang, setLangState] = useState('en');
  const [prefs, setPrefsState] = useState({ hoverPreview: true });

  useEffect(() => {
    const sync = () => {
      setLangState(getAppLang());
      setPrefsState(getPrefs());
    };
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    return () => window.removeEventListener(PREFS_EVENT, sync);
  }, []);

  const t = (key) => DICT[lang]?.[key] || DICT.en[key] || key;
  return { lang, t, prefs };
}
