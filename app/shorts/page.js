import ShortsPlayer from '@/components/ShortsPlayer';

export const metadata = {
  title: 'Infinite Movie Reels & Shorts',
  description: 'Scroll endlessly through trending high-view movie clips, funny scenes, anime moments, and trailers.',
  alternates: { canonical: '/shorts/' },
};

export default function ShortsPage() {
  return <ShortsPlayer />;
}
