jsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Card from '@/components/Card';
import { byLang } from '@/lib/data';
import { LANGS, langBySlug } from '@/lib/constants';

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((l) => ({ lang: l.slug }));
}

export function generateMetadata({ params }) {
  const l = langBySlug(params.lang);
  if (!l) return {};
  return {
    title: `Watch ${l.name} Movies & Series Online HD`,
    description: `Stream top ${l.name} movies and web series online in HD for free.`,
    alternates: { canonical: `/language/${l.slug}/` },
  };
}

export default function LanguagePage({ params }) {
  const l = langBySlug(params.lang);
  if (!l) notFound();

  const list = byLang(l.code).slice(0, 90);

  return (
    <>
      <div className="page-banner">
        <h1>{l.name} Movies &amp; Series</h1>
        <p>{list.length} titles available in {l.name}</p>
      </div>

      <div className="chips-scroll">
        {LANGS.map((item) => (
          <Link
            key={item.slug}
            href={`/language/${item.slug}/`}
            className={`chip ${item.slug === l.slug ? 'active' : ''}`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-box">
          <h2>No {l.name} titles synced yet</h2>
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
