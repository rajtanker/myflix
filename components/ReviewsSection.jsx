'use client';
import { useEffect, useState } from 'react';
import { StarIcon } from '@/components/Icons';
import { addUserReview, getUserReviews, subscribeStorage } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';

export default function ReviewsSection({ movieId, internetReviews = [] }) {
  const { t } = useI18n();
  const [userReviews, setUserReviews] = useState([]);'use client';
import { useEffect, useState } from 'react';
import { StarIcon } from '@/components/Icons';
import { addUserReview, getUserReviews, subscribeStorage } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';

function cleanReviewText(txt = '') {
  return String(txt)
    .replace(/[*_#`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ReviewsSection({ movieId, internetReviews = [], item = null }) {
  const { t } = useI18n();
  const [userReviews, setUserReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(9);
  const [content, setContent] = useState('');

  useEffect(() => {
    setUserReviews(getUserReviews(movieId));
    return subscribeStorage(() => setUserReviews(getUserReviews(movieId)));
  }, [movieId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addUserReview(movieId, {
      author: author.trim() || 'Guest Viewer',
      rating: Number(rating),
      content: content.trim(),
    });
    setContent('');
    setShowForm(false);
  };

  const webTop = [...(internetReviews || [])]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6)
    .map((r) => ({ ...r, content: cleanReviewText(r.content), source: 'Top Web Critic / Viewer' }));

  const combined = [
    ...userReviews.map((r) => ({ ...r, source: 'Your Review' })),
    ...webTop,
  ];

  return (
    <section className="reviews-sec">
      <div className="sec-head">
        <h2 className="sec-title">
          <span className="sec-bar" />
          {t('reviews')} ({combined.length})
        </h2>
        <button
          type="button"
          className="sec-more"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Close Form' : `+ ${t('writeReview')}`}
        </button>
      </div>

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-row">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your Name (optional)"
            />
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>★ {n} / 10</option>
              ))}
            </select>
          </div>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your honest thoughts on this title..."
            required
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Publish Review
          </button>
        </form>
      )}

      {combined.length > 0 ? (
        <div className="reviews-list">
          {combined.map((r, i) => (
            <article key={i} className="review-card">
              <div className="review-head">
                <div>
                  <strong>{r.author || 'Critic'}</strong>
                  <span className="review-tag">{r.source}</span>
                </div>
                {r.rating > 0 && (
                  <span className="pill pill-gold">
                    <StarIcon size={11} /> {r.rating}/10
                  </span>
                )}
              </div>
              <p className="review-text">{r.content}</p>
              {r.createdAt && <small className="review-date">{r.createdAt}</small>}
            </article>
          ))}
        </div>
      ) : (
        <div className="consensus-card">
          <div>
            <strong>Audience Consensus</strong>
            <p>
              {item?.rating > 0
                ? `Rated ${Number(item.rating).toFixed(1)}/10 globally${item.voteCount ? ` across ${item.voteCount.toLocaleString()} verified audience votes` : ''}.`
                : 'Early release — audience scores and critic reviews are still rolling in.'}
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            Add First Review
          </button>
        </div>
      )}
    </section>
  );
}
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(9);
  const [content, setContent] = useState('');

  useEffect(() => {
    setUserReviews(getUserReviews(movieId));
    return subscribeStorage(() => setUserReviews(getUserReviews(movieId)));
  }, [movieId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addUserReview(movieId, {
      author: author.trim() || 'Guest Viewer',
      rating: Number(rating),
      content: content.trim(),
    });
    setContent('');
  };

  const combined = [
    ...userReviews.map((r) => ({ ...r, source: 'Your Review' })),
    ...internetReviews.map((r) => ({ ...r, source: 'Top Critic / Web Review' })),
  ];

  return (
    <section className="reviews-sec">
      <div className="sec-head">
        <h2 className="sec-title">
          <span className="sec-bar" />
          {t('reviews')} ({combined.length})
        </h2>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <div className="review-form-row">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your Name (optional)"
          />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>★ {n} / 10</option>
            ))}
          </select>
        </div>
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts on this title..."
          required
        />
        <button type="submit" className="btn btn-primary btn-sm">
          {t('writeReview')}
        </button>
      </form>

      {combined.length > 0 ? (
        <div className="reviews-list">
          {combined.map((r, i) => (
            <article key={i} className="review-card">
              <div className="review-head">
                <div>
                  <strong>{r.author || 'Critic'}</strong>
                  <span className="review-tag">{r.source}</span>
                </div>
                {r.rating > 0 && (
                  <span className="pill pill-gold">
                    <StarIcon size={11} /> {r.rating}/10
                  </span>
                )}
              </div>
              <p className="review-text">{r.content}</p>
              {r.createdAt && <small className="review-date">{r.createdAt}</small>}
            </article>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--dim)', fontSize: 13.5 }}>
          No reviews yet. Be the first to review this title!
        </p>
      )}
    </section>
  );
}
