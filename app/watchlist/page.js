import WatchlistClient from '@/components/WatchlistClient';

export const metadata = {
  title: 'My Watchlist & Watch History',
  description: 'Manage your bookmarked movies, TV series, and watch history.',
  alternates: { canonical: '/watchlist/' },
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}
