js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
const INDEX_FILE = path.join(process.cwd(), 'public', 'db.json');

let items = [];
try {
  items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(items)) items = [];
} catch {
  items = [];
}

if (items.length === 0 && process.env.TMDB_API_KEY) {
  console.log('Catalog empty & TMDB_API_KEY detected — running initial sync...');
  execSync('node scripts/update.mjs', { stdio: 'inherit' });
  items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

const slimIndex = items.map((m) => ({
  id: m.id,
  tmdb: m.tmdb,
  type: m.type,
  title: m.title,
  slug: m.slug,
  year: m.year,
  releaseDate: m.releaseDate || '',
  poster: m.poster,
  rating: m.rating || 0,
  lang: m.lang || 'en',
  genres: m.genres || [],
  popularity: m.popularity || 0,
}));

fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
fs.writeFileSync(INDEX_FILE, JSON.stringify(slimIndex));
console.log(`Synced public/db.json (${slimIndex.length} titles).`);
```

#### ফাইল ৪৮ — `.github/workflows/auto.yml`
```yaml
name: Auto Update Catalog

on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Fetch latest movies & TV shows from TMDB
        env:
          TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}
        run: node scripts/update.mjs

      - name: Commit & Push catalog updates
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/movies.json public/db.json
          if ! git diff --staged --quiet; then
            git commit -m "auto: update catalog $(date -u +%F)"
            git pull --rebase
            git push
          fi

      - name: Ping IndexNow
        continue-on-error: true
        run: |
          curl -s -X POST https://api.indexnow.org/indexnow \
            -H "Content-Type: application/json" \
            -d "{\"host\":\"myflix.pages.dev\",\"key\":\"a1b2c3d4e5f6a7b8\",\"keyLocation\":\"https://myflix.pages.dev/a1b2c3d4e5f6a7b8.txt\",\"urlList\":[\"https://myflix.pages.dev/\",\"https://myflix.pages.dev/browse/\",\"https://myflix.pages.dev/movies/\",\"https://myflix.pages.dev/tv-shows/\"]}"
