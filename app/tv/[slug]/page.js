import Link from 'next/link';
import { notFound } from 'next/navigation';
import Player from '@/components/Player';
import Card from '@/components/Card';
import SafeImage from '@/components/SafeImage';
import { BannerAd, NativeAd } from '@/components/AdBanner';
import { StarIcon } from '@/components/Icons';
import { all, bySlug, related } from '@/lib/data';
import { TV_SERVERS, SITE } from '@/lib/config';
import { genreNameToSlug, langByCode } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  const shows = all().filter((m) => m.type === 'tv');
  if (shows.length === 0) return [{ slug: '_placeholder' }];
  return shows.map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }) {
  const m = bySlug(params.slug, 'tv');
  if (!m) return { title: 'Catalog Initializing' };
  const img = m.backdrop || m.poster;
  return {
    title: `Watch ${m.title} (${m.year}) All Episodes Online HD`,
    description: `Stream all seasons and episodes of ${m.title} (${m.year}) in HD for free on ${SITE.name}. ${m.overview?.slice(0, 130) || ''}`,
    alternates: { canonical: `/tv/${m.slug}/` },
    openGraph: {
      title: `${m.title} — Watch All Episodes`,
      description: m.overview || '',
      images: img ? [img] : [],
    },
  };
}

export default function TvPage({ params }) {
  if (params.slug === '_placeholder') {
    return (
      <div className="empty-box">
        <h2>Catalog Initializing</h2>
        <p>Run the Auto Update workflow to populate TV series from TMDB.</p>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  const m = bySlug(params.slug, 'tv');
  if (!m) notFound();

  const langObj = langByCode(m.lang);
  const relList = related(m, 12);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: m.title,
    startDate: m.releaseDate || String(m.year),
    numberOfSeasons: m.seasons || 1,
    description: m.overview,
    image: m.poster || m.backdrop,
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
            <Link href="/tv-shows/">TV Shows</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>{m.title}</span>
          </nav>

          <Player item={m} servers={TV_SERVERS} />
        </div>
      </div>

      {/* Adsterra Banner 300x250 */}
      <BannerAd
        adKey="f10ea2fbe22f1ee5f877554186d017a5"
        width={300}
        height={250}
        scriptSrc="https://bancadeltempoidea.org/22/f10ea2fbe22f1ee5f877554186d017a5"
      />

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
            <span className="meta-pill">
              {m.seasons || m.seasonList?.length || 1} Season{(m.seasons || 1) > 1 ? 's' : ''}
            </span>
            {m.runtime > 0 && <span className="meta-pill">~{m.runtime} min/ep</span>}
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
              <div><strong>Created by:</strong> {m.director}</div>
            )}
            {m.cast?.length > 0 && (
              <div><strong>Starring:</strong> {m.cast.join(', ')}</div>
            )}
            {m.releaseDate && (
              <div><strong>First Aired:</strong> {m.releaseDate}</div>
            )}
          </div>
        </div>
      </section>

      {/* Adsterra Native Banner */}
      <NativeAd
        scriptUrl="https://bancadeltempoidea.org/21/bef6ed04dae55e2de1bae450e9965634"
        containerId="bef6ed04dae55e2de1bae450e9965634"
      />

      {relList.length > 0 && (
        <section>
          <div className="sec-head">
            <h2 className="sec-title">
              <span className="sec-bar" />
              Similar Series &amp; Movies
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
