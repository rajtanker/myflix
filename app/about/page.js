jsx
import { SITE } from '@/lib/config';

export const metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <article className="prose-card">
      <h1>About {SITE.name}</h1>
      <p>
        {SITE.name} is a modern movie and TV series discovery index designed for fast, effortless browsing across global cinema, trending shows, animation, and regional classics.
      </p>
      <h2>How Our Catalog Works</h2>
      <p>
        Our catalog metadata, posters, synopses, trailers, and cast information are updated automatically via the TMDB API.
      </p>
      <h2>Third-Party Content Notice</h2>
      <p>
        {SITE.name} does not upload, store, or host any video files on its own servers. All embedded streams originate from independent third-party providers.
      </p>
    </article>
  );
}
