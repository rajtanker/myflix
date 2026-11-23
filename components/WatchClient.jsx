'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Player from '@/components/Player';
import Card from '@/components/Card';
import SafeImage from '@/components/SafeImage';
import ReviewsSection from '@/components/ReviewsSection';
import { BannerAd, NativeAd } from '@/components/AdBanner';
import { GenreIcon, StarIcon } from '@/components/Icons';
import { MOVIE_SERVERS, TV_SERVERS } from '@/lib/config';
import { genreNameToSlug, langByCode } from '@/lib/constants';

export default function WatchClient() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const id = searchParams.get('id') || '';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError('No title selected.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    fetch(`/api/tmdb?action=detail&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error === 'MISSING_KEY') {
          setError('Live TMDB API is not configured yet. Add TMDB_API_KEY in Cloudflare Pages Settings -> Variables and Secrets.');
        } else if (!res.item) {
          setError('Title could not be loaded.');
        } else {
          setData(res);
          document.title = `Watch ${res.item.title} (${res.item.year}) | MYFLIX`;
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not reach live catalog.');
        setLoading(false);
      });
  }, [type, id]);

  if (loading) {
    return <div className="empty-box" style={{ marginTop: 30 }}>Loading stream &amp; details...</div>;
  }

  if (error || !data?.item) {
    return (
      <div className="empty-box" style={{ marginTop: 30 }}>
        <h2>{error || 'Title Not Found'}</h2>
        <p>Try browsing our curated catalog or searching another title.</p>
        <Link href="/browse/" className="btn btn-primary">Explore Catalog</Link>
      </div>
    );
  }

  const m = data.item;
  const relList = data.related || [];
  const langObj = langByCode(m.lang);

  return (
    <>
      <div className="watch-backdrop">
        <SafeImage src={m.backdrop || m.poster} fallback="/nobackdrop.svg" alt="" className="watch-backdrop-img" />
        <div className="watch-backdrop-fade" />

        <div className="watch-inner">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href={m.type === 'tv' ? '/tv-shows/' : '/movies/'}>
              {m.type === 'tv' ? 'TV Shows' : 'Movies'}
            </Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>{m.title}</span>
          </nav>

          <Player item={m} servers={m.type === 'tv' ? TV_SERVERS : MOVIE_SERVERS} />
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
            {m.type === 'tv' && m.seasons > 0 && (
              <span className="meta-pill">{m.seasons} Season{m.seasons > 1 ? 's' : ''}</span>
            )}
            {m.runtime > 0 && (
              <span className="meta-pill">{m.type === 'tv' ? `~${m.runtime} min/ep` : `${m.runtime} min`}</span>
            )}
            {langObj && (
              <Link href={`/language/${langObj.slug}/`} className="meta-pill link">
                {langObj.name}
              </Link>
            )}
            {(m.genres || []).map((g) => (
              <Link key={g} href={`/genre/${genreNameToSlug(g)}/`} className="meta-pill link">
                <GenreIcon genre={g} size={12} /> {g}
              </Link>
            ))}
          </div>

          <p className="detail-overview">{m.overview || 'No synopsis available.'}</p>

          <div className="detail-facts">
            {m.director && (
              <div>
                <strong>{m.type === 'tv' ? 'Created by:' : 'Director:'}</strong>{' '}
                <Link href={`/browse/?q=${encodeURIComponent(m.director)}`} className="meta-pill link">
                  {m.director}
                </Link>
              </div>
            )}
            {m.cast?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <strong>Starring:</strong>
                {m.cast.map((actor) => (
                  <Link key={actor} href={`/browse/?q=${encodeURIComponent(actor)}`} className="meta-pill link">
                    {actor}
                  </Link>
                ))}
              </div>
            )}
            {m.releaseDate && (
              <div><strong>Release Date:</strong> {m.releaseDate}</div>
            )}
          </div>
        </div>
      </section>

      {/* Adsterra Native Banner */}
      <NativeAd
        scriptUrl="https://bancadeltempoidea.org/21/bef6ed04dae55e2de1bae450e9965634"
        containerId="bef6ed04dae55e2de1bae450e9965634"
      />

      <ReviewsSection movieId={m.id} internetReviews={m.reviews || []} />

      {relList.length > 0 && (
        <section>
          <div className="sec-head">
            <h2 className="sec-title"><span className="sec-bar" />You May Also Like</h2>
          </div>
          <div className="grid">
            {relList.map((x) => <Card key={x.id} m={x} />)}
          </div>
        </section>
      )}
    </>
  );
}
