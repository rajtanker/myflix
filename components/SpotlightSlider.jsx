'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { PlayIcon, StarIcon } from '@/components/Icons';

export default function SpotlightSlider({ movies = [], series = [] }) {
  const [mIdx, setMIdx] = useState(0);
  const [sIdx, setSIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      if (movies.length > 1) setMIdx((i) => (i + 1) % movies.length);
      if (series.length > 1) setSIdx((i) => (i + 1) % series.length);
    }, 5500);
    return () => clearInterval(t);
  }, [movies.length, series.length, paused]);

  if (!movies.length && !series.length) return null;

  const spotMovie = movies[mIdx] || movies[0];
  const spotSeries = series[sIdx] || series[0];

  return (
    <section
      className="spotlight-grid"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {spotMovie && (
        <div className="spotlight-card">
          <Link href={`/movie/${spotMovie.slug}/`} className="spotlight-link-cover">
            <SafeImage
              key={spotMovie.id}
              src={spotMovie.backdrop || spotMovie.poster}
              fallback="/nobackdrop.svg"
              alt={spotMovie.title}
              className="spotlight-bg"
            />
            <div className="spotlight-ov" />
            <div className="spotlight-info">
              <span className="pill pill-acc">WORLD-CLASS FILM • #{mIdx + 1}</span>
              <h3>{spotMovie.title}</h3>
              <p>{spotMovie.overview}</p>
              <div className="spotlight-meta">
                <span><StarIcon size={12} /> {Number(spotMovie.rating).toFixed(1)}</span>
                <span>{spotMovie.year}</span>
                <span className="spotlight-cta"><PlayIcon size={13} /> Watch Now</span>
              </div>
            </div>
          </Link>

          {movies.length > 1 && (
            <div className="spotlight-dots">
              {movies.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  aria-label={`Featured movie ${i + 1}`}
                  className={i === mIdx ? 'active' : ''}
                  onClick={() => setMIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {spotSeries && (
        <div className="spotlight-card">
          <Link href={`/tv/${spotSeries.slug}/`} className="spotlight-link-cover">
            <SafeImage
              key={spotSeries.id}
              src={spotSeries.backdrop || spotSeries.poster}
              fallback="/nobackdrop.svg"
              alt={spotSeries.title}
              className="spotlight-bg"
            />
            <div className="spotlight-ov" />
            <div className="spotlight-info">
              <span className="pill pill-gold">ACCLAIMED SERIES • #{sIdx + 1}</span>
              <h3>{spotSeries.title}</h3>
              <p>{spotSeries.overview}</p>
              <div className="spotlight-meta">
                <span><StarIcon size={12} /> {Number(spotSeries.rating).toFixed(1)}</span>
                <span>{spotSeries.year}</span>
                <span className="spotlight-cta"><PlayIcon size={13} /> Stream Episodes</span>
              </div>
            </div>
          </Link>

          {series.length > 1 && (
            <div className="spotlight-dots">
              {series.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Featured series ${i + 1}`}
                  className={i === sIdx ? 'active' : ''}
                  onClick={() => setSIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
