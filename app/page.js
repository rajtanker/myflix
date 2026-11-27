import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import CarouselRow from '@/components/CarouselRow';
import ContinueWatching from '@/components/ContinueWatching';
import PersonalizedSection from '@/components/PersonalizedSection';
import MoodPicker from '@/components/MoodPicker';
import SpotlightSlider from '@/components/SpotlightSlider';
import Card from '@/components/Card';
import SafeImage from '@/components/SafeImage';
import { GenreIcon, CalendarIcon } from '@/components/Icons';
import { all, trending, newest, topRated, upcoming, anime, news, byGenre, byType } from '@/lib/data';
import { GENRES, LANGS } from '@/lib/constants';
import { COLLECTIONS } from '@/lib/collections';

export default function HomePage() {
  const items = all();
  const trendList = trending(15);
  const heroItems = trendList.slice(0, 6);
  const top10 = trendList.slice(0, 10);
  const latestReleases = newest(18);
  const upcomingList = upcoming(12);
  const animeList = anime(15);
  const series = byType('tv').slice(0, 15);
  const bestRated = topRated(15);
  const action = byGenre('Action').slice(0, 15);
  const scifi = byGenre('Sci-Fi').slice(0, 15);
  const thriller = byGenre('Thriller').slice(0, 15);
  const asian = items.filter((m) => ['ko', 'ja', 'zh'].includes(m.lang)).slice(0, 15);
  const indian = items.filter((m) => ['hi', 'bn', 'ta', 'te', 'ml', 'kn'].includes(m.lang)).slice(0, 15);
  const newsItems = news(4);

  // Pick 8 world-best iconic popular movies & 8 series for auto-rotating dual spotlight
  const spotMovies = items
    .filter((m) => m.type === 'movie' && m.backdrop && (m.rating || 0) >= 7.5 && (m.voteCount || 0) >= 800)
    .sort((a, b) => (b.rating || 0) * Math.log10(b.voteCount || 10) - (a.rating || 0) * Math.log10(a.voteCount || 10))
    .slice(0, 8);
  const finalSpotMovies = spotMovies.length >= 3 ? spotMovies : topRated(8, 'movie');

  const spotSeries = items
    .filter((m) => m.type === 'tv' && m.backdrop && (m.rating || 0) >= 7.6 && (m.voteCount || 0) >= 200)
    .sort((a, b) => (b.rating || 0) * Math.log10(b.voteCount || 10) - (a.rating || 0) * Math.log10(a.voteCount || 10))
    .slice(0, 8);
  const finalSpotSeries = spotSeries.length >= 3 ? spotSeries : topRated(8, 'tv');

  return (
    <>
      <HeroCarousel items={heroItems} />

      <div className="chips-scroll" aria-label="Quick filters">
        <Link href="/browse/" className="chip active">All Catalog</Link>
        {GENRES.slice(0, 9).map((g) => (
          <Link key={g.slug} href={`/genre/${g.slug}/`} className="chip">
            <GenreIcon genre={g.name} size={13} />
            {g.name}
          </Link>
        ))}
        {LANGS.slice(0, 5).map((l) => (
          <Link key={l.slug} href={`/language/${l.slug}/`} className="chip">
            {l.name}
          </Link>
        ))}
      </div>

      <ContinueWatching />

      {/* Top 10 Trending BEFORE Picked For You */}
      <CarouselRow
        title="Top 10 Trending This Week"
        items={top10}
        viewAllHref="/browse/?sort=popular"
        ranked
      />

      <PersonalizedSection />

      <section className="growth-strip">
        <div className="sec-head" style={{ marginTop: 14 }}>
          <h2 className="sec-title"><span className="sec-bar" />Top Curated Lists &amp; Quiz</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/quiz/" className="btn btn-primary btn-sm">Play Movie Quiz</Link>
            <Link href="/collections/" className="sec-more">All Lists →</Link>
          </div>
        </div>
        <div className="chips-scroll">
          {COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}/`} className="chip">
              {c.short}
            </Link>
          ))}
        </div>
      </section>

      <MoodPicker />

      {latestReleases.length > 0 && (
        <section>
          <div className="sec-head">
            <h2 className="sec-title"><span className="sec-bar" />New Releases</h2>
            <Link href="/browse/?sort=newest" className="sec-more">Browse New →</Link>
          </div>
          <div className="grid">
            {latestReleases.map((m) => <Card key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* Auto-Rotating Dual Spotlight (8 World-Best Movies & 8 Series) */}
      <SpotlightSlider movies={finalSpotMovies} series={finalSpotSeries} />

      <CarouselRow title="Popular TV Series" items={series} viewAllHref="/tv-shows/" />
      <CarouselRow title="Anime Universe" items={animeList} viewAllHref="/anime/" />

      {upcomingList.length > 0 && (
        <section>
          <div className="sec-head">
            <h2 className="sec-title">
              <span className="sec-bar" />
              <CalendarIcon size={18} />
              Upcoming Releases
            </h2>
            <Link href="/upcoming/" className="sec-more">Full Calendar →</Link>
          </div>
          <div className="row-track">
            {upcomingList.map((m) => <Card key={m.id} m={m} />)}
          </div>
        </section>
      )}

      <CarouselRow title="Critically Acclaimed & Top Rated" items={bestRated} viewAllHref="/browse/?sort=rating" />
      <CarouselRow title="Action & High-Octane" items={action} viewAllHref="/genre/action/" />
      <CarouselRow title="Sci-Fi & Mind-Bending Worlds" items={scifi} viewAllHref="/genre/sci-fi/" />
      <CarouselRow title="Crime, Mystery & Thrillers" items={thriller} viewAllHref="/genre/thriller/" />
      <CarouselRow title="K-Drama & Asian Cinema" items={asian} viewAllHref="/language/korean/" />
      <CarouselRow title="Indian & South Asian Hits" items={indian} viewAllHref="/language/hindi/" />

      {newsItems.length > 0 && (
        <section className="subtle-news-sec">
          <div className="sec-head">
            <h2 className="sec-title" style={{ fontSize: 16, opacity: 0.85 }}>
              <span className="sec-bar" />
              Cinema Buzz &amp; Daily Updates
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/shorts/" className="sec-more">Watch Shorts</Link>
              <Link href="/news/" className="sec-more">All News →</Link>
            </div>
          </div>
          <div className="subtle-news-grid">
            {newsItems.map((n) => (
              <Link key={n.id} href={n.href} className="subtle-news-card">
                <SafeImage src={n.image} fallback="/nobackdrop.svg" alt={n.title} />
                <div>
                  <span className="subtle-tag">{n.tag} • {n.date}</span>
                  <h4>{n.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
