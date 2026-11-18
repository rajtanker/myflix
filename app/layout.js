import './globals.css';
import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { SITE } from '@/lib/config';
import { GENRES, LANGS } from '@/lib/constants';

// ১. শুধু নিচের 'G-XXXXXXXXXX' বদলে তোমার নিজের Google Tag ID বসাও:
const GA_ID = 'GTM-K6CP8JFM';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
  // ২. (ঐচ্ছিক) Search Console HTML tag দিলে নিচের কোটেশনের ভেতর বসাতে পারো:
   verification: { google: 'f2RsoNx7PCap3X3nRwtLkJIlr7S3sdbA5Fj34ahCp0M' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="main-container">{children}</main>
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
              <p style={{ maxWidth: 380, lineHeight: 1.65 }}>
                {SITE.description}
              </p>
            </div>

            <div className="footer-col">
              <h3>Browse</h3>
              <div className="footer-links">
                <Link href="/movies/">Trending Movies</Link>
                <Link href="/tv-shows/">Popular TV Series</Link>
                <Link href="/browse/">Full Catalog Explorer</Link>
                {GENRES.slice(0, 4).map((g) => (
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

        {GA_ID && GA_ID !== 'G-XXXXXXXXXX' && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
