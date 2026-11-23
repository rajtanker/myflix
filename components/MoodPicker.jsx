'use client';
import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';

const HUBS = [
  { title: 'Hollywood Hits', sub: 'Global Blockbusters', href: '/language/english/', grad: 'linear-gradient(135deg, #1b2845, #274060)' },
  { title: 'K-Drama World', sub: 'Korean Series & Films', href: '/language/korean/', grad: 'linear-gradient(135deg, #3a1c71, #d76d77)' },
  { title: 'Anime Realm', sub: 'Japanese Animation', href: '/genre/animation/', grad: 'linear-gradient(135deg, #16222a, #3a6073)' },
  { title: 'Bollywood & South', sub: 'Hindi, Tamil, Bangla', href: '/language/hindi/', grad: 'linear-gradient(135deg, #642b73, #c6426e)' },
  { title: 'Sci-Fi & Future', sub: 'Space & Mind-Benders', href: '/genre/sci-fi/', grad: 'linear-gradient(135deg, #0f2027, #2c5364)' },
  { title: 'Dark Thrillers', sub: 'Crime & Mystery', href: '/genre/thriller/', grad: 'linear-gradient(135deg, #3c1014, #8b1e24)' },
];

const MOODS = [
  { id: 'mind', label: 'Mind-Bending', genres: ['Sci-Fi', 'Mystery'] },
  { id: 'adrenaline', label: 'Adrenaline Rush', genres: ['Action', 'Thriller'] },
  { id: 'feelgood', label: 'Feel-Good', genres: ['Comedy', 'Family', 'Romance'] },
  { id: 'scary', label: 'Late Night Horror', genres: ['Horror'] },
  { id: 'critics', label: 'Critics Choice (7.8+)', minRating: 7.8 },
];

export default function MoodPicker() {
  const [activeMood, setActiveMood] = useState(null);
  const [moodItems, setMoodItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectMood = async (mood) => {
    if (activeMood === mood.id) {
      setActiveMood(null);
      setMoodItems([]);
      return;
    }
    setActiveMood(mood.id);
    setLoading(true);
    try {
      const r = await fetch('/db.json');
      const db = r.ok ? await r.json() : [];
      const filtered = db
        .filter((m) => {
          if (mood.minRating) return (m.rating || 0) >= mood.minRating;
          return (m.genres || []).some((g) => mood.genres.includes(g));
        })
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 12);
      setMoodItems(filtered);
    } catch {
      setMoodItems([]);
    }
    setLoading(false);
  };

  const triggerSurprise = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('myflix:surprise'));
    }
  };

  return (
    <section className="mood-section">
      <div className="hubs-grid">
        {HUBS.map((h) => (
          <Link
            key={h.title}
            href={h.href}
            className="hub-card"
            style={{ background: h.grad }}
          >
            <div className="hub-title">{h.title}</div>
            <div className="hub-sub">{h.sub}</div>
          </Link>
        ))}
      </div>

      <div className="mood-bar">
        <span className="mood-label">Pick Your Mood:</span>
        <div className="mood-pills">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`chip ${activeMood === m.id ? 'active' : ''}`}
              onClick={() => selectMood(m)}
            >
              {m.label}
            </button>
          ))}
          <button
            type="button"
            className="chip surprise-btn"
            onClick={triggerSurprise}
          >
            Surprise Me!
          </button>
        </div>
      </div>

      {activeMood && (
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div className="grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="grid">
              {moodItems.map((m) => (
                <Card key={m.id} m={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
