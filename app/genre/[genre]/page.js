jsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Card from '@/components/Card';
import { byGenre } from '@/lib/data';
import { GENRES, genreBySlug } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return GENRES.map((g) => ({ genre: g.slug }));
}

export function generateMetadata({ params }) {
  const g = genreBySlug(params.genre);
  if (!g) return {};
  return {
    title: `Best ${g.name} Movies & TV Series Online HD`,
    description: `Watch top ${g.name} movies and TV series online in HD for free.`,
    alternates: { canonical: `/genre/${g.slug}/` },
  };
}

export default function GenrePage({ params }) {
  const g = genreBySlug(params.genre);
  if (!g) notFound();

  const list = byGenre(g.name).slice(0, 90);

  return (
    <>
      <div className="page-banner">
        <h1>{g.name} Movies &amp; TV Series</h1>
        <p>{list.length} titles available in {g.name}</p>
      </div>

      <div className="chips-scroll">
        {GENRES.map((item) => (
          <Link
            key={item.slug}
            href={`/genre/${item.slug}/`}
            className={`chip ${item.slug === g.slug ? 'active' : ''}`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-box">
          <h2>No {g.name} titles synced yet</h2>
          <p>Check back after the next automatic TMDB update.</p>
          <Link href="/browse/" className="btn btn-primary">Explore All</Link>
        </div>
      ) : (
        <div className="grid">
          {list.map((m) => <Card key={m.id} m={m} />)}
        </div>
      )}
    </>
  );
}
