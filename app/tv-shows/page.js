jsx
import Link from 'next/link';
import Card from '@/components/Card';
import { byType, newest } from '@/lib/data';

export const metadata = {
  title: 'Watch Popular TV Series & Web Shows Online',
  description: 'Binge-watch trending TV series, K-dramas, and anime in HD for free.',
  alternates: { canonical: '/tv-shows/' },
};

export default function TvShowsPage() {
  const popular = byType('tv').slice(0, 48);
  const fresh = newest(18, 'tv');

  return (
    <>
      <div className="page-banner" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <h1>TV Series</h1>
          <p>Stream complete seasons of trending dramas, sci-fi epics, anime, and sitcoms.</p>
        </div>
        <Link href="/browse/?type=tv" className="btn btn-primary btn-sm">
          Filter All Series →
        </Link>
      </div>

      {fresh.length > 0 && (
        <>
          <div className="sec-head">
            <h2 className="sec-title"><span className="sec-bar" />Recently Aired Series</h2>
          </div>
          <div className="grid">
            {fresh.map((m) => <Card key={m.id} m={m} />)}
          </div>
        </>
      )}

      <div className="sec-head">
        <h2 className="sec-title"><span className="sec-bar" />Popular TV Shows</h2>
      </div>
      <div className="grid">
        {popular.map((m) => <Card key={m.id} m={m} />)}
      </div>
    </>
  );
}
