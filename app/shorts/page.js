import ShortsPlayer from '@/components/ShortsPlayer';

export const metadata = {
  title: 'Movie Clips & Shorts',
  description: 'Watch short movie clips, funny moments, behind-the-scenes featurettes, and teasers.',
  alternates: { canonical: '/shorts/' },
};

export default function ShortsPage() {
  return (
    <>
      <div className="page-banner" style={{ textAlign: 'center' }}>
        <h1>Movie Clips &amp; Shorts</h1>
        <p>Bite-sized movie scenes, behind-the-scenes moments, and official teasers.</p>
      </div>
      <ShortsPlayer />
    </>
  );
}
