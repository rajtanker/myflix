jsx
import Link from 'next/link';
import Card from '@/components/Card';
import { byType, newest } from '@/lib/data';

export const metadata = {
  title: 'Watch Popular & New HD Movies Online',
  description: 'Stream the latest blockbusters and top-rated movies in HD for free.',
  alternates: { canonical: '/movies/' },
};

export default function MoviesPage() {
  const popular = byType('movie').slice(0, 48);
  const fresh = newest(24, 'movie');

  return (
    <>
      <div className="page-banner" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <h1>Movies</h1>
          <p>Trending theatrical hits, new digital releases, and timeless cinema.</p>
        </div>
        <Link href="/browse/?type=movie" className="btn btn-primary btn-sm">
          Filter All Movies →
        </Link>
      </div>

      {fresh.length > 0 && (
        <>
          <div className="sec-head">
            <h2 className="sec-title"><span className="sec-bar" />Latest Movie Releases</h2>
          </div>
          <div className="grid">
            {fresh.map((m) => <Card key={m.id} m={m} />)}
          </div>
        </>
      )}

      <div className="sec-head">
        <h2 className="sec-title"><span className="sec-bar" />Trending &amp; Popular Movies</h2>
      </div>
      <div className="grid">
        {popular.map((m) => <Card key={m.id} m={m} />)}
      </div>
    </>
  );
}
