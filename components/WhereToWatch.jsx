import { langByCode } from '@/lib/constants';

export default function WhereToWatch({ item }) {
  const providers = item?.providers || [];
  const tmdbWatchUrl = `https://www.themoviedb.org/${item.type === 'tv' ? 'tv' : 'movie'}/${item.tmdb}/watch`;
  const langName = langByCode(item.lang)?.name || 'Original Audio';

  if (!providers.length) return null;

  return (
    <div className="wtw-box">
      <div className="wtw-head">
        <strong>Where to Watch {item.title}</strong>
        <span>{langName} • Official Streaming Availability</span>
      </div>
      <div className="wtw-list">
        {providers.map((p) => (
          <a
            key={p.name}
            href={tmdbWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="wtw-pill"
          >
            {p.logo && <img src={`https://image.tmdb.org/t/p/w92${p.logo}`} alt={p.name} />}
            <span>{p.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
