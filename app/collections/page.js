import Link from 'next/link';
import { COLLECTIONS } from '@/lib/collections';

export const metadata = {
  title: 'Curated Movie & TV Collections — Best Lists',
  description: 'Explore handpicked lists of the best sci-fi, anime, K-dramas, horror, and top-rated classics.',
  alternates: { canonical: '/collections/' },
};

export default function CollectionsIndexPage() {
  return (
    <>
      <div className="page-banner">
        <h1>Curated Collections &amp; Top Lists</h1>
        <p>Handpicked rankings across genres, languages, and cinema eras.</p>
      </div>

      <div className="col-hub-grid">
        {COLLECTIONS.map((c, idx) => (
          <Link key={c.slug} href={`/collections/${c.slug}/`} className="col-hub-card">
            <span className="pill pill-acc">LIST #{idx + 1}</span>
            <h2>{c.title}</h2>
            <p>{c.description}</p>
            <span className="col-hub-cta">Explore List →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
