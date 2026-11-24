import fs from 'fs';
import path from 'path';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.log('Telegram credentials not set — skipping.');
  process.exit(0);
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://myflix-7uh.pages.dev').replace(/\/$/, '');
const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json');
const POSTED_FILE = path.join(process.cwd(), 'data', 'tg-posted.json');

const escHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let items = [];
try { items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { items = []; }

let posted = [];
try { posted = JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8')); } catch { posted = []; }
const postedSet = new Set(posted);

// Pick top 2 unposted high-quality titles (safe limit to avoid spam)
const toPost = items
  .filter((m) => !postedSet.has(m.id) && (m.poster || m.backdrop))
  .slice(0, 2);

for (const m of toPost) {
  const link = `${SITE_URL}/${m.type === 'tv' ? 'tv' : 'movie'}/${m.slug}/`;
  const photo = m.backdrop || m.poster;
  const genres = (m.genres || []).slice(0, 3).join(', ') || 'Entertainment';
  const tags = (m.genres || []).slice(0, 3).map((g) => `#${g.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
  const rating = m.rating > 0 ? `★ ${Number(m.rating).toFixed(1)}/10` : 'New Release';
  const synopsis = (m.overview || '').slice(0, 220);

  const caption =
    `🎬 <b>${escHtml(m.title)} (${escHtml(m.year)})</b>\n` +
    `⭐ ${rating}  |  🎭 ${escHtml(genres)}\n\n` +
    `${escHtml(synopsis)}${m.overview?.length > 220 ? '...' : ''}\n\n` +
    `${tags} #Movies #MyFlix`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        photo,
        caption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '▶ Watch Trailer & Details', url: link }]],
        },
      }),
    });
    if (r.ok) {
      postedSet.add(m.id);
      console.log(`Posted to Telegram: ${m.title}`);
    }
  } catch (e) {
    console.error('Telegram post failed:', e.message);
  }
  await new Promise((res) => setTimeout(res, 1200));
}

fs.mkdirSync(path.dirname(POSTED_FILE), { recursive: true });
fs.writeFileSync(POSTED_FILE, JSON.stringify(Array.from(postedSet).slice(-1500)));
