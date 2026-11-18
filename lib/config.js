js
export const SITE = {
  name: 'MYFLIX',
  brandPrefix: 'MY',
  brandAccent: 'FLIX',
  tagline: 'Stream Free HD Movies & TV Series Online',
  description:
    'Watch the latest blockbusters, trending TV series, anime, K-dramas, and regional cinema in HD for free. No signup required.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://myflix.pages.dev',
  email: 'contact@yourdomain.com',
  indexNowKey: 'a1b2c3d4e5f6a7b8',
};

export const MOVIE_SERVERS = [
  { name: 'VidLink Pro', hint: 'Fastest • HD', tpl: 'https://vidlink.pro/movie/{tmdb}' },
  { name: 'VidSrc CC', hint: 'Multi-Audio', tpl: 'https://vidsrc.cc/v2/embed/movie/{tmdb}' },
  { name: 'Embed.su', hint: 'Subtitles', tpl: 'https://embed.su/embed/movie/{tmdb}' },
  { name: 'AutoEmbed', hint: 'Backup HD', tpl: 'https://player.autoembed.cc/embed/movie/{tmdb}' },
  { name: 'VidSrc XYZ', hint: 'Mirror 1', tpl: 'https://vidsrc.xyz/embed/movie?tmdb={tmdb}' },
  { name: 'MultiEmbed', hint: 'Mirror 2', tpl: 'https://multiembed.mov/?video_id={tmdb}&tmdb=1' },
];

export const TV_SERVERS = [
  { name: 'VidLink Pro', hint: 'Fastest • HD', tpl: 'https://vidlink.pro/tv/{tmdb}/{s}/{e}' },
  { name: 'VidSrc CC', hint: 'Multi-Audio', tpl: 'https://vidsrc.cc/v2/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'Embed.su', hint: 'Subtitles', tpl: 'https://embed.su/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'AutoEmbed', hint: 'Backup HD', tpl: 'https://player.autoembed.cc/embed/tv/{tmdb}/{s}/{e}' },
  { name: 'VidSrc XYZ', hint: 'Mirror 1', tpl: 'https://vidsrc.xyz/embed/tv?tmdb={tmdb}&season={s}&episode={e}' },
];
