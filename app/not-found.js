jsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-box" style={{ marginTop: 40 }}>
      <h1 style={{ fontSize: 56, color: '#e50914', marginBottom: 8 }}>404</h1>
      <h2>Page Not Found</h2>
      <p>The movie, series, or page you are looking for could not be found or has moved.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
        <Link href="/browse/" className="btn btn-glass">Explore Catalog</Link>
      </div>
    </div>
  );
}
