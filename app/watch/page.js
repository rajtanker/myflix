import { Suspense } from 'react';
import WatchClient from '@/components/WatchClient';

export const metadata = {
  title: 'Watch Online HD',
  description: 'Stream movies, TV series, and anime from our unlimited TMDB catalog.',
  robots: { index: false, follow: true },
};

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="empty-box" style={{ marginTop: 30 }}>Loading player...</div>}>
      <WatchClient />
    </Suspense>
  );
}
