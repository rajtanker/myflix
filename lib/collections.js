export const COLLECTIONS = [
  {
    slug: 'highest-rated-movies-all-time',
    title: '50 Highest Rated Movies of All Time',
    short: 'Top Rated Classics & Masterpieces',
    description: 'Discover the highest rated movies of all time ranked by audience and critic scores.',
    intro: 'From timeless cinema masterpieces to modern epics, explore the highest-rated movies ever released across every era and language.',
    type: 'movie',
    minRating: 7.8,
    sort: 'rating',
    faqs: [
      { q: 'How are the highest rated movies ranked?', a: 'Movies are ranked using verified audience vote averages and overall popularity scores.' },
      { q: 'Can I filter top rated movies by genre or era?', a: 'Yes! Use our Unlimited Explorer to filter by any decade from 1920 to 2026 or any genre.' },
    ],
  },
  {
    slug: 'best-sci-fi-movies',
    title: 'Best Sci-Fi & Mind-Bending Movies to Watch',
    short: 'Best Sci-Fi & Space Epics',
    description: 'Stream and explore the best science fiction movies, cyberpunk thrillers, and space epics.',
    intro: 'Journey through dystopian futures, time loops, and interstellar adventures with our curated list of must-watch sci-fi movies.',
    genres: ['Sci-Fi'],
    sort: 'popular',
    faqs: [
      { q: 'Which sci-fi movies are best for fans of Inception and Interstellar?', a: 'Check our top-ranked Sci-Fi and Mystery selections below for mind-bending plots and visual spectacle.' },
      { q: 'Are sci-fi TV series included?', a: 'Yes, this collection features both blockbuster sci-fi films and acclaimed series.' },
    ],
  },
  {
    slug: 'best-korean-dramas',
    title: 'Best Korean Dramas & K-Movies (2026 Guide)',
    short: 'Top K-Dramas & Korean Hits',
    description: 'Watch trending Korean dramas, romantic K-series, and acclaimed Korean thrillers.',
    intro: 'Korean cinema and K-dramas continue to captivate audiences worldwide. Browse the highest-rated Korean shows and films here.',
    langs: ['ko'],
    sort: 'popular',
    faqs: [
      { q: 'What are the most popular K-dramas right now?', a: 'Trending Korean hits are updated automatically every day at the top of this collection.' },
      { q: 'Do these Korean titles include English info and trailers?', a: 'Yes, every title includes full English synopses, episode guides, cast, and trailers.' },
    ],
  },
  {
    slug: 'top-anime-series-movies',
    title: 'Top Anime Series & Animated Films to Binge',
    short: 'Best Anime Series & Films',
    description: 'Explore top-rated Japanese anime series, shonen action, and Studio anime films.',
    intro: 'Whether you love long-running shonen adventures or critically acclaimed anime films, discover the finest Japanese animation here.',
    langs: ['ja'],
    genres: ['Animation'],
    sort: 'popular',
    faqs: [
      { q: 'Are all anime seasons and episodes organized?', a: 'Yes, every anime series includes a clean season and episode selector with automatic resume.' },
      { q: 'Are anime movies included too?', a: 'Yes, both theatrical anime features and multi-season anime series appear in this list.' },
    ],
  },
  {
    slug: 'best-action-movies',
    title: 'Best High-Octane Action Movies & Series',
    short: 'Best Action Blockbusters',
    description: 'Explosive action movies, martial arts hits, superhero blockbusters, and spy thrillers.',
    intro: 'Non-stop adrenaline, martial arts choreography, and blockbuster stunts—explore the most popular action titles available right now.',
    genres: ['Action'],
    sort: 'popular',
    faqs: [
      { q: 'What action movies are trending this week?', a: 'Our action list refreshes daily with the biggest theatrical and streaming action releases.' },
      { q: 'Can I watch trailers before starting a movie?', a: 'Yes, click the Info or Trailer button on any title to watch its official HD trailer first.' },
    ],
  },
  {
    slug: 'mind-bending-thrillers',
    title: 'Best Crime, Mystery & Psychological Thrillers',
    short: 'Dark Crime & Thrillers',
    description: 'Gripping crime dramas, whodunit mysteries, and psychological thrillers with plot twists.',
    intro: 'Love edge-of-your-seat suspense and unforgettable plot twists? Dive into the highest-rated crime and mystery thrillers.',
    genres: ['Thriller', 'Crime', 'Mystery'],
    sort: 'rating',
    faqs: [
      { q: 'Which thriller series are worth binge-watching?', a: 'Check the Series badges in this collection for acclaimed crime and mystery TV shows.' },
      { q: 'Are classic detective movies included?', a: 'Yes, this list blends modern psychological thrillers with iconic crime classics.' },
    ],
  },
  {
    slug: 'scariest-horror-movies',
    title: 'Scariest Horror & Supernatural Movies',
    short: 'Late Night Horror Picks',
    description: 'Terrifying supernatural horror films, slashers, and eerie paranormal series.',
    intro: 'Turn down the lights and explore the highest-rated horror movies and supernatural series guaranteed to keep you awake.',
    genres: ['Horror'],
    sort: 'popular',
    faqs: [
      { q: 'What are the best horror movies to watch at night?', a: 'Top-rated supernatural and psychological horror picks are listed right at the top.' },
      { q: 'Can I filter horror movies by year?', a: 'Yes, visit our Explorer page to filter horror releases by specific year or decade.' },
    ],
  },
  {
    slug: 'best-comedy-movies',
    title: 'Best Feel-Good Comedy Movies & Sitcoms',
    short: 'Top Comedy & Feel-Good',
    description: 'Laugh-out-loud comedies, rom-coms, and binge-worthy sitcoms for any mood.',
    intro: 'Need a good laugh? Browse crowd-pleasing comedies, buddy films, romantic comedies, and beloved TV sitcoms.',
    genres: ['Comedy'],
    sort: 'popular',
    faqs: [
      { q: 'Does this list include both comedy movies and TV sitcoms?', a: 'Yes, you will find hilarious standouts from both movies and multi-season comedy series.' },
      { q: 'How can I find family-friendly comedies?', a: 'Check our Family & Animation collection or filter by Family genre on the Browse page.' },
    ],
  },
  {
    slug: 'best-bollywood-indian-movies',
    title: 'Best Bollywood, Bangla & South Indian Cinema',
    short: 'Bollywood, Bangla & South Hits',
    description: 'Stream top Hindi, Bengali, Tamil, Telugu, and Malayalam movies and web series.',
    intro: 'Explore blockbuster Hindi cinema, critically acclaimed Bengali films, and high-energy South Indian action hits.',
    langs: ['hi', 'bn', 'ta', 'te', 'ml', 'kn'],
    sort: 'popular',
    faqs: [
      { q: 'Which Indian and regional languages are covered?', a: 'Hindi, Bangla, Tamil, Telugu, Malayalam, and Kannada titles are all synced automatically.' },
      { q: 'Can I browse just one language like Hindi or Bangla?', a: 'Yes! Use our dedicated Language pages in the footer or filter by language in Explore.' },
    ],
  },
  {
    slug: 'best-family-animation',
    title: 'Best Animated & Family Movies for Everyone',
    short: 'Family & Animated Gems',
    description: 'Heartwarming animated adventures and family movies loved by kids and adults alike.',
    intro: 'Perfect for family movie night—discover top-rated animated features, Pixar/Disney hits, and heartwarming family stories.',
    genres: ['Family', 'Animation'],
    sort: 'rating',
    faqs: [
      { q: 'Are these movies suitable for family movie night?', a: 'Yes, every title in this list belongs to the Family or Animation genre.' },
      { q: 'Can I save movies for the weekend?', a: 'Yes, click the + button on any poster to add it to your personal Watchlist.' },
    ],
  },
  {
    slug: 'top-90s-2000s-classics',
    title: 'Best 90s & 2000s Nostalgic Movie Classics',
    short: '90s & 2000s Throwback Classics',
    description: 'Relive the golden era of cinema with unforgettable 1990s and 2000s blockbusters.',
    intro: 'From iconic 90s dramas to early-2000s cult hits, revisit the unforgettable classics that shaped modern cinema.',
    minYear: 1990,
    maxYear: 2009,
    sort: 'rating',
    faqs: [
      { q: 'Can I find movies older than 1990 as well?', a: 'Yes! Search any classic title from 1920 onward using the search bar or Explorer.' },
      { q: 'Are 90s TV series included?', a: 'Yes, classic series from the 90s and 2000s appear alongside iconic feature films.' },
    ],
  },
  {
    slug: 'best-romance-dramas',
    title: 'Best Romance Movies & Emotional Dramas',
    short: 'Top Romance & Love Stories',
    description: 'Heartfelt romantic films, period dramas, and unforgettable love stories.',
    intro: 'Explore deeply moving dramas and timeless romantic stories from Hollywood, Korea, Europe, and South Asia.',
    genres: ['Romance'],
    sort: 'rating',
    faqs: [
      { q: 'What are the highest-rated romantic movies here?', a: 'Our Romance collection automatically ranks titles with the strongest audience ratings at the top.' },
      { q: 'Does this include Korean and English romances?', a: 'Yes, top romantic movies and series from around the world are included.' },
    ],
  },
];

export function collectionBySlug(slug) {
  return COLLECTIONS.find((c) => c.slug === slug) || null;
}

export function filterCollectionItems(col, allItems) {
  const list = allItems.filter((m) => {
    if (col.type && m.type !== col.type) return false;
    if (col.minRating && (m.rating || 0) < col.minRating) return false;
    if (col.genres && !col.genres.some((g) => (m.genres || []).includes(g))) return false;
    if (col.langs && !col.langs.includes(m.lang)) return false;
    const y = Number(m.year);
    if (col.minYear && (!y || y < col.minYear)) return false;
    if (col.maxYear && (!y || y > col.maxYear)) return false;
    return true;
  });

  const sorted = [...list];
  if (col.sort === 'rating') {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }
  return sorted.slice(0, 60);
}
