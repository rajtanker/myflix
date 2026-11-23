import Link from 'next/link';
import Card from '@/components/Card';
import { anime } from '@/lib/data';

export const metadata = {
  title: 'Anime Universe — Stream Anime Series & Movies',
  description: 'Watch top-rated Japanese anime series and animated films in HD.',
  alternates: { canonical: '/anime/' },
};

export default function AnimePage() {
  const list = anime(60);

  return (
    <>
      <div className="page-banner" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <h1>Anime Universe</h1>
          <p>Trending Japanese anime series, classics, and theatrical anime films.</p>
        </div>
        <Link href="/browse/?genre=Animation&lang=ja" className="btn btn-primary btn-sm">
          Filter All Anime →
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="empty-box">
          <h2>No Anime Synced Yet</h2>
          <p>Run the Auto Update workflow to pull top anime titles automatically.</p>
        </div>
      ) : (
        <div className="grid">
          {list.map((m) => <Card key={m.id} m={m} />)}
        </div>
      )}
    </>
  );
}
