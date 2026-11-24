import Link from 'next/link';
import { notFound } from 'next/navigation';
import Card from '@/components/Card';
import SocialShareBar from '@/components/SocialShareBar';
import { all } from '@/lib/data';
import { SITE } from '@/lib/config';
import { COLLECTIONS, collectionBySlug, filterCollectionItems } from '@/lib/collections';

export const dynamicParams = false;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const col = collectionBySlug(params.slug);
  if (!col) return {};
  return {
    title: col.title,
    description: col.description,
    alternates: { canonical: `/collections/${col.slug}/` },
  };
}

export default function CollectionDetailPage({ params }) {
  const col = collectionBySlug(params.slug);
  if (!col) notFound();

  const items = filterCollectionItems(col, all());
  const baseUrl = SITE.url.replace(/\/$/, '');

  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: col.title,
    description: col.description,
    itemListElement: items.slice(0, 15).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.title,
      url: `${baseUrl}/${m.type === 'tv' ? 'tv' : 'movie'}/${m.slug}/`,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: col.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/collections/">Collections</Link>
        <span>/</span>
        <span style={{ color: '#fff' }}>{col.short}</span>
      </nav>

      <div className="page-banner">
        <h1>{col.title}</h1>
        <p style={{ maxWidth: 820 }}>{col.intro}</p>
      </div>

      <SocialShareBar title={col.title} path={`/collections/${col.slug}/`} />

      {items.length === 0 ? (
        <div className="empty-box" style={{ marginTop: 20 }}>
          <h2>Syncing Collection</h2>
          <p>Run Auto Update Catalog to populate this collection.</p>
          <Link href="/browse/" className="btn btn-primary">Explore All</Link>
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 20 }}>
          {items.map((m) => <Card key={m.id} m={m} />)}
        </div>
      )}

      <section className="faq-sec">
        <div className="sec-head">
          <h2 className="sec-title"><span className="sec-bar" />Collection FAQ</h2>
        </div>
        <div className="faq-list">
          {col.faqs.map((f, i) => (
            <details key={i} className="faq-item" open>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
