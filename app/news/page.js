import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { news } from '@/lib/data';

export const metadata = {
  title: 'Cinema News & Daily Buzz',
  description: 'Daily auto-updated movie news, box office trends, and upcoming release highlights.',
  alternates: { canonical: '/news/' },
};

export default function NewsPage() {
  const items = news(24);

  return (
    <>
      <div className="page-banner">
        <h1>Cinema Buzz &amp; News</h1>
        <p>Daily digest of trending releases, box office highlights, and upcoming premieres.</p>
      </div>

      <div className="news-grid">
        {items.map((n) => (
          <Link key={n.id} href={n.href} className="news-card">
            <div className="news-img-wrap">
              <SafeImage src={n.image} fallback="/nobackdrop.svg" alt={n.title} />
              <span className="news-tag">{n.tag}</span>
            </div>
            <div className="news-body">
              <small>{n.date}</small>
              <h3>{n.title}</h3>
              <p>{n.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
