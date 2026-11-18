jsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Player from '@/components/Player';
import Card from '@/components/Card';
import SafeImage from '@/components/SafeImage';
import { StarIcon } from '@/components/Icons';
import { all, bySlug, related } from '@/lib/data';
import { MOVIE_SERVERS, SITE } from '@/lib/config';
import { genreNameToSlug, langByCode } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  const movies = all().filter((m) => m.type === 'movie');
  if (movies.length === 0) return [{ slug: '_placeholder' }];
  return movies.map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }) {
  const m = bySlug(params.slug, 'movie');
  if (!m) return { title: 'Catalog Initializing' };
  const img = m.backdrop || m.poster;
  return {
    title: `Watch ${m.title} (${m.year}) Online Free HD`,
    description: `Stream ${m.title} (${m.year}) full movie in HD for free on ${SITE.name}. ${m.overview?.slice(0, 140) || ''}`,
    alternates: { canonical: `/movie/${m.slug}/` },
    openGraph: {
      title: `${m.title} (${m.year}) — Watch Online`,
      description: m.overview || '',
      images: img ? [img] : [],
    },
  };
}

export default function MoviePage({ params }) {
  if (params.slug === '_placeholder') {
    return (
      <div className="empty-box">
        <h2>Catalog Initializing</h2>
        <p>Run the Auto Update workflow to populate movies from TMDB.</p>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  const m = bySlug(params.slug, 'movie');
  if (!m) notFound();

  const langObj = langByCode(m.lang);
  const relList = related(m, 12);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: m.title,
    datePublished: m.releaseDate || String(m.year),
    description: m.overview,
    image: m.poster || m.backdrop,
    aggregateRating: m.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Number(m.rating).toFixed(1),
      bestRating: '10',
      ratingCount: m.voteCount || 100,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="watch-backdrop">
        <SafeImage
          src={m.backdrop || m.poster}
          fallback="/nobackdrop.svg"
          alt=""
          className="watch-backdrop-img"
        />
        <div className="watch-backdrop-fade" />

        <div className="watch-inner">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/movies/">Movies</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>{m.title}</span>
          </nav>

          <Player item={m} servers={MOVIE_SERVERS} />
        </div>
      </div>

      <div className="ad-slot">{/* Optional Ad Banner */}</div>

      <section className="detail-grid">
        <div className="detail-poster">
          <SafeImage src={m.poster} fallback="/noposter.svg" alt={m.title} />
        </div>

        <div>
          <h1 className="detail-title">
            {m.title} {m.year && m.year !== '—' ? `(${m.year})` : ''}
          </h1>
          {m.tagline && <p className="detail-tagline">&ldquo;{m.tagline}&rdquo;</p>}

          <div className="meta-badges">
            {m.rating > 0 && (
              <span className="meta-pill gold">
                <StarIcon size={13} /> {Number(m.rating).toFixed(1)} / 10
              </span>
            )}
            {m.runtime > 0 && <span className="meta-pill">{m.runtime} min</span>}
            {langObj && (
              <Link href={`/language/${langObj.slug}/`} className="meta-pill link">
                {langObj.name}
              </Link>
            )}
            {(m.genres || []).map((g) => (
              <Link key={g} href={`/genre/${genreNameToSlug(g)}/`} className="meta-pill link">
                {g}
              </Link>
            ))}
          </div>

          <p className="detail-overview">{m.overview || 'No synopsis available.'}</p>

          <div className="detail-facts">
            {m.director && (
              <div><strong>Director:</strong> {m.director}</div>
            )}
            {m.cast?.length > 0 && (
              <div><strong>Starring:</strong> {m.cast.join(', ')}</div>
            )}
            {m.releaseDate && (
              <div><strong>Release Date:</strong> {m.releaseDate}</div>
            )}
          </div>
        </div>
      </section>

      {relList.length > 0 && (
        <section>
          <div className="sec-head">
            <h2 className="sec-title">
              <span className="sec-bar" />
              You May Also Like
            </h2>
          </div>
          <div className="grid">
            {relList.map((x) => (
              <Card key={x.id} m={x} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
