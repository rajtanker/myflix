import './globals.css';
import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import FloatingUI from '@/components/FloatingUI';
import { SITE } from '@/lib/config';
import { GENRES, LANGS } from '@/lib/constants';

export const viewport = {
  themeColor: '#07080d',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'watch movies online',
    'free hd movies',
    'tv series streaming',
    'k-drama',
    'anime',
    'myflix',
  ],
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const baseUrl = SITE.url.replace(/\/$/, '');
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: `${baseUrl}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd).replace(/</g, '\\u003c'),
          }}
        />

        <Header />
        <main className="main-container">{children}</main>
        <FloatingUI />
        <Toast />

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-col">
              <div className="logo" style={{ marginBottom: 10 }}>
                <span>
                  {SITE.brandPrefix}
                  <span className="logo-accent">{SITE.brandAccent}</span>
                </span>
              </div>
              <p style={{ maxWidth: 360, lineHeight: 1.65 }}>
                {SITE.description}
              </p>
              <div className="footer-pills">
                <span className="footer-pill">HD Quality</span>
                <span className="footer-pill">Daily Auto-Sync</span>
                <span className="footer-pill">No Signup</span>
              </div>
              <div className="footer-kbd-tip">
                <span>Quick Search: Press</span>
                <kbd>/</kbd>
                <span>or</span>
                <kbd>Ctrl + K</kbd>
              </div>
            </div>

            <div className="footer-col">
              <h3>Explore</h3>
              <div className="footer-links">
                <Link href="/movies/">Trending Movies</Link>
                <Link href="/tv-shows/">Popular TV Series</Link>
                <Link href="/browse/">Full Catalog Explorer</Link>
                <Link href="/watchlist/">My Watchlist</Link>
                <Link href="/search/">Search Catalog</Link>
              </div>
            </div>

            <div className="footer-col">
              <h3>Top Genres</h3>
              <div className="footer-links">
                {GENRES.slice(0, 6).map((g) => (
                  <Link key={g.slug} href={`/genre/${g.slug}/`}>{g.name}</Link>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h3>Languages &amp; Legal</h3>
              <div className="footer-links">
                {LANGS.slice(0, 4).map((l) => (
                  <Link key={l.slug} href={`/language/${l.slug}/`}>{l.name} Cinema</Link>
                ))}
                <Link href="/about/">About Us</Link>
                <Link href="/dmca/">DMCA</Link>
                <Link href="/privacy/">Privacy Policy</Link>
                <Link href="/contact/">Contact</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              Disclaimer: {SITE.name} does not host any files on its servers. All media is provided by non-affiliated third-party services.
            </span>
            <span>
              Powered by TMDB API (not endorsed or certified by TMDB).
            </span>
          </div>
        </footer>

        {/* Cloudflare Web Analytics */}
        <Script
          id="cloudflare-analytics"
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "30f3345615a44b22b3c79e2cc6d3f4fc"}'
          strategy="afterInteractive"
        />

        {/* Adsterra Popunder */}
        <Script
          id="adsterra-popunder"
          src="https://aarems.org/1/081f833d8b8a7f5b9bbf742fbb97ddbe"
          strategy="afterInteractive"
          data-cfasync="false"
        />

        {/* Adsterra Social Bar */}
        <Script
          id="adsterra-socialbar"
          src="https://bancadeltempoidea.org/14/43f9d96c58e5ba16a80327bc033f8cf4"
          strategy="afterInteractive"
          data-cfasync="false"
        />
      </body>
    </html>
  );
}
