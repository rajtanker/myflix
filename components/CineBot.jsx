'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { BotIcon, CloseIcon, StarIcon } from '@/components/Icons';
import { GENRES, LANGS } from '@/lib/constants';
import { getInterests } from '@/lib/storage';

let dbCache = null;
async function loadDb() {
  if (dbCache) return dbCache;
  try {
    const r = await fetch('/db.json');
    const d = r.ok ? await r.json() : [];
    dbCache = Array.isArray(d) ? d : [];
    return dbCache;
  } catch {
    return [];
  }
}

const PROMPTS = [
  'Best sci-fi movies',
  'Top Korean dramas',
  'Funny comedy movies',
  'Horror after 2022',
  'Suggest from my interests',
];

export default function CineBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([
    {
      role: 'bot',
      text: 'Hi! I am CineBot. Tell me what mood, genre, actor, or language you want to watch (e.g. "Mind-bending sci-fi" or "Top anime series")!',
      items: [],
    },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('myflix:cinebot', onOpen);
    return () => window.removeEventListener('myflix:cinebot', onOpen);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const askBot = async (text) => {
    const query = text.trim();
    if (!query) return;
    setInput('');
    setMsgs((prev) => [...prev, { role: 'user', text: query }]);

    const db = await loadDb();
    const q = query.toLowerCase();

    const wantType = q.includes('series') || q.includes('show') || q.includes('drama') ? 'tv'
      : q.includes('movie') || q.includes('film') ? 'movie' : null;

    const matchedGenres = GENRES.filter((g) => q.includes(g.name.toLowerCase())).map((g) => g.name);
    if (q.includes('anime')) matchedGenres.push('Animation');
    if (q.includes('funny')) matchedGenres.push('Comedy');
    if (q.includes('scary')) matchedGenres.push('Horror');

    const matchedLangs = LANGS.filter((l) => q.includes(l.name.toLowerCase())).map((l) => l.code);
    if (q.includes('k-drama') || q.includes('kdrama')) matchedLangs.push('ko');
    if (q.includes('anime')) matchedLangs.push('ja');
    if (q.includes('bollywood')) matchedLangs.push('hi');
    if (q.includes('hollywood')) matchedLangs.push('en');

    const yearMatch = q.match(/(19\d\d|20\d\d)/);
    const minYear = yearMatch ? Number(yearMatch[1]) : 0;
    const interests = getInterests();

    const scored = db
      .map((m) => {
        let s = (m.rating || 0) * 0.4 + (m.popularity || 0) * 0.005;
        if (wantType && m.type === wantType) s += 4;
        matchedGenres.forEach((g) => { if ((m.genres || []).includes(g)) s += 6; });
        matchedLangs.forEach((l) => { if (m.lang === l) s += 6; });
        if (minYear && Number(m.year) >= minYear) s += 3;
        if (q.includes('interest') || q.includes('for me')) {
          interests.genres.forEach((g) => { if ((m.genres || []).includes(g)) s += 5; });
          interests.langs.forEach((l) => { if (m.lang === l) s += 4; });
        }
        if ((m.title || '').toLowerCase().includes(q)) s += 10;
        if ((m.cast || []).some((c) => q.includes(c.toLowerCase()))) s += 10;
        return { item: m, score: s };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.item);

    const reply = scored.length
      ? `Here are my top picks for "${query}":`
      : `I couldn't find an exact match, try another genre or click Surprise Me!`;

    setMsgs((prev) => [...prev, { role: 'bot', text: reply, items: scored }]);
  };

  return (
    <>
      <button
        type="button"
        className="cinebot-fab"
        aria-label="Open CineBot AI Recommendations"
        title="CineBot Recommendations"
        onClick={() => setOpen((v) => !v)}
      >
        <BotIcon size={21} />
        <span>CineBot</span>
      </button>

      {open && (
        <div className="cinebot-drawer" role="dialog" aria-label="CineBot AI">
          <div className="cinebot-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BotIcon size={18} />
              <strong>CineBot AI</strong>
            </div>
            <button type="button" className="modal-close" onClick={() => setOpen(false)}>
              <CloseIcon size={16} />
            </button>
          </div>

          <div className="cinebot-msgs">
            {msgs.map((msg, idx) => (
              <div key={idx} className={`cb-msg ${msg.role}`}>
                <p>{msg.text}</p>
                {msg.items?.length > 0 && (
                  <div className="cb-cards">
                    {msg.items.map((m) => (
                      <Link
                        key={m.id}
                        href={m.type === 'tv' ? `/tv/${m.slug}/` : `/movie/${m.slug}/`}
                        className="cb-card"
                        onClick={() => setOpen(false)}
                      >
                        <SafeImage src={m.poster} fallback="/noposter.svg" alt={m.title} />
                        <div>
                          <div className="cb-card-title">{m.title}</div>
                          <div className="cb-card-meta">
                            <span>{m.year}</span>
                            <span><StarIcon size={10} /> {Number(m.rating).toFixed(1)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="cb-prompts">
            {PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => askBot(p)}>{p}</button>
            ))}
          </div>

          <form
            className="cb-form"
            onSubmit={(e) => { e.preventDefault(); askBot(input); }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for any mood, genre, or actor..."
            />
            <button type="submit" className="btn btn-primary btn-sm">Send</button>
          </form>
        </div>
      )}
    </>
  );
}
