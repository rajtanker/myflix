jsx
import { Suspense } from 'react';
import BrowseClient from '@/components/BrowseClient';

export const metadata = {
  title: 'Search Movies & TV Shows',
  description: 'Search thousands of HD movies and TV series instantly.',
  alternates: { canonical: '/search/' },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="empty-box">Loading search...</div>}>
      <BrowseClient mode="search" />
    </Suspense>
  );
}
