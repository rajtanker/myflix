import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { CalendarIcon, GenreIcon, PlayIcon } from '@/components/Icons';
import { upcoming } from '@/lib/data';

export const metadata = {
  title: 'Upcoming Movies & TV Releases',
  description: 'Discover upcoming blockbusters, release dates, synopses, and trailers.',
  alternates: { canonical: '/upcoming/' },
};

export default function UpcomingPage() {
  const list = upcoming(36);

  return (
    <>
      <div className="page-banner">
        <h1>Upcoming Releases</h1>
        <p>Mark your calendar for the most anticipated upcoming movies &amp; series.</p>
      </div>

      {list.length === 0 ? (
        <div className="empty-box">
          <h2>Syncing Upcoming Slate</h2>
          <p>Run the Auto Update workflow to fetch the newest upcoming release dates from TMDB.</p>
          <Link href="/browse/" className="btn btn-primary">Explore Current Catalog</Link>
        </div>
      ) : (
        <div className="upcoming-grid">
          {list.map((m) => (
            <Link
              key={m.id}
              href={m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`}
              className="upcoming-card"
            >
              <div className="upcoming-poster">
                <SafeImage src={m.poster} fallback="/noposter.svg" alt={m.title} />
              </div>
              <div className="upcoming-body">
                <div className="upcoming-date">
                  <CalendarIcon size={13} />
                  <span>{m.releaseDate || m.year || 'Coming Soon'}</span>
                </div>
                <h3>{m.title}</h3>
                <div className="upcoming-genres">
                  {(m.genres || []).slice(0, 3).map((g) => (
                    <span key={g} className="meta-pill">
                      <GenreIcon genre={g} size={11} /> {g}
                    </span>
                  ))}
                </div>
                <p>{m.overview || 'Details and trailer coming soon.'}</p>
                <span className="upcoming-cta"><PlayIcon size={12} /> Details &amp; Trailer</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
