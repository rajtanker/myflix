export const SITE = {
  name: 'MYFLIX',
  brandPrefix: 'MY',
  brandAccent: 'FLIX',
  tagline: 'Stream Free HD Movies & TV Series Online',
  description:
    'Watch the latest blockbusters, trending TV series, anime, K-dramas, and regional cinema in HD for free. No signup required.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://myflix-7uh.pages.dev',
  email: 'contact@yourdomain.com',
  indexNowKey: 'a1b2c3d4e5f6a7b8',
};

const envAds = process.env.NEXT_PUBLIC_ADS_ENABLED;

export const ADS = {
  enabled: envAds === undefined ? false : envAds === 'true',
  popunder: true,
  socialBar: true,
  banners: true,
};

export const MOVIE_SERVERS = [
  { name: 'VidLink Pro', hint: '1080p', tpl: 'https://vidlink.pro/movie/{tmdb}' },
  { name: 'MultiEmbed Mirror', hint: 'Multi', tpl: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1' },
];

export const TV_SERVERS = [
  { name: 'VidLink Pro', hint: '1080p', tpl: 'https://vidlink.pro/tv/{tmdb}/{s}/{e}' },
  { name: 'MultiEmbed Mirror', hint: 'Multi', tpl: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1&s={s}&e={e}' },
];
