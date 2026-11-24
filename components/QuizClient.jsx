'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { StarIcon, ShareIcon } from '@/components/Icons';
import { SITE } from '@/lib/config';
import { showToast } from '@/lib/storage';

const TOTAL_Q = 10;

function pickQuestions(items) {
  const pool = items.filter((m) => m.poster && m.overview && m.overview.length > 35 && (m.rating || 0) >= 6);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, TOTAL_Q);

  return selected.map((target) => {
    const distractors = pool
      .filter((x) => x.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    return { target, options };
  });
}

export default function QuizClient() {
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(true);

  const startNewGame = async () => {
    setLoading(true);
    try {
      const r = await fetch('/db.json');
      const db = r.ok ? await r.json() : [];
      setQuestions(pickQuestions(Array.isArray(db) ? db : []));
      setIdx(0);
      setScore(0);
      setPicked(null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  if (loading) return <div className="empty-box" style={{ marginTop: 24 }}>Preparing Movie Quiz...</div>;
  if (!questions.length) {
    return (
      <div className="empty-box" style={{ marginTop: 24 }}>
        <h2>Quiz Needs More Movies</h2>
        <p>Run Auto Update Catalog first to load titles.</p>
      </div>
    );
  }

  const finished = idx >= questions.length;
  const shareText = `I scored ${score}/${questions.length} on the ${SITE.name} Movie Quiz! Think you know movies better? Play here:`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `${SITE.url}/quiz/`;

  const copyScore = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      showToast('Score copied! Challenge your friends');
    } catch {}
  };

  if (finished) {
    return (
      <div className="quiz-card" style={{ textAlign: 'center' }}>
        <span className="pill pill-gold" style={{ marginBottom: 12 }}>QUIZ COMPLETE</span>
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>{score} / {questions.length}</h1>
        <p style={{ color: 'var(--dim)', marginBottom: 22 }}>
          {score >= 8
            ? 'Certified Cinema Genius! You know your movies inside out.'
            : score >= 5
            ? 'Solid Movie Buff! Challenge your friends to beat your score.'
            : 'Time for a movie marathon! Watch more hits and play again.'}
        </p>

        <div className="share-bar-btns" style={{ justifyContent: 'center', marginBottom: 22 }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-pill wa"
          >
            Challenge on WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-pill fb"
          >
            Share on Facebook
          </a>
          <button type="button" className="share-pill copy" onClick={copyScore}>
            <ShareIcon size={13} /> Copy Score
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={startNewGame}>Play Again</button>
          <Link href="/" className="btn btn-glass">Back Home</Link>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const maskTitle = (text, title) => {
    if (!title) return text;
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), '[HIDDEN TITLE]');
  };

  const handlePick = (optId) => {
    if (picked !== null) return;
    setPicked(optId);
    if (optId === q.target.id) setScore((s) => s + 1);
  };

  const nextQ = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  return (
    <div className="quiz-card">
      <div className="quiz-top">
        <span>Question {idx + 1} of {questions.length}</span>
        <span className="pill pill-gold"><StarIcon size={12} /> Score: {score}</span>
      </div>

      <div className="quiz-clues">
        <span className="pill">{q.target.type === 'tv' ? 'TV Series' : 'Movie'}</span>
        <span className="pill">Year: {q.target.year}</span>
        {(q.target.genres || []).slice(0, 3).map((g) => (
          <span key={g} className="pill">{g}</span>
        ))}
      </div>

      <p className="quiz-plot">&ldquo;{maskTitle(q.target.overview, q.target.title)}&rdquo;</p>

      <div className="quiz-options">
        {q.options.map((opt) => {
          const isChosen = picked === opt.id;
          const isRight = opt.id === q.target.id;
          let cls = 'quiz-opt';
          if (picked !== null) {
            if (isRight) cls += ' right';
            else if (isChosen) cls += ' wrong';
          }
          return (
            <button key={opt.id} type="button" className={cls} onClick={() => handlePick(opt.id)}>
              <SafeImage src={opt.poster} fallback="/noposter.svg" alt={opt.title} />
              <div>
                <strong>{opt.title}</strong>
                <span>{opt.year}</span>
              </div>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 10 }}>
          <Link
            href={q.target.live || !q.target.slug ? `/watch/?type=${q.target.type}&id=${q.target.tmdb}` : `/${q.target.type}/${q.target.slug}/`}
            className="sec-more"
          >
            Watch &ldquo;{q.target.title}&rdquo; →
          </Link>
          <button type="button" className="btn btn-primary" onClick={nextQ}>
            {idx + 1 === questions.length ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}
