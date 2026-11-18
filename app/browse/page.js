import { Suspense } from 'react';
import BrowseClient from '@/components/BrowseClient';

export const metadata = {
  title: 'Explore & Filter Movies and TV Shows',
  description: 'Filter our entire HD catalog by genre, language, release year, and rating.',
  alternates: { canonical: '/browse/' },
};

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="empty-box">Loading catalog...</div>}>
      <BrowseClient mode="browse" />
    </Suspense>
  );
}
