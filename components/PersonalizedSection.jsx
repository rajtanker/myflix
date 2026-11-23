'use client';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { CloseIcon, PlusIcon, SparklesIcon, GenreIcon } from '@/components/Icons';
import { GENRES, LANGS } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';
import {
  getHistory,
  getInterests,
  getWatchlist,
  saveInterests,
  subscribeStorage,
} from '@/lib/storage';

export default function PersonalizedSection() {
  const { t } = useI18n();
  const [recs, setRecs] = useState([]);
  const [interests, setInterests] = useState({ genres: [], langs: [] });
  const [openModal, setOpenModal] = useState(false);
  const [draftGenres, setDraftGenres] = useState([]);
  const [draftLangs, setDraftLangs] = useState([]);

  const computeRecs = async () => {
    try {
      const r = await fetch('/db.json');
      const db = r.ok ? await r.json() : [];
      if (!Array.isArray(db) || !db.length) return;

      const hist = getHistory();
      const wl = getWatchlist();
      const userInt = getInterests();
      setInterests(userInt);

      const seenIds = new Set([...hist.map((x) => x.id), ...wl.map((x) => x.id)]);
      const genreWeight = {};
      const langWeight = {};

      userInt.genres.forEach((g) => { genreWeight[g] = (genreWeight[g] || 0) + 5; });
      userInt.langs.forEach((l) => { langWeight[l] = (langWeight[l] || 0) + 4; });

      [...hist, ...wl].forEach((m) => {
        (m.genres || []).forEach((g) => { genreWeight[g] = (genreWeight[g] || 0) + 2; });
        if (m.lang) langWeight[m.lang] = (langWeight[m.lang] || 0) + 1.5;
      });

      const hasSignals = Object.keys(genreWeight).length > 0 || Object.keys(langWeight).length > 0;

      const scored = db
        .filter((m) => !seenIds.has(m.id) && m.poster)
        .map((m) => {
          let score = (m.rating || 0) * 0.4;
          (m.genres || []).forEach((g) => { score += genreWeight[g] || 0; });
          score += langWeight[m.lang] || 0;
          if (!hasSignals) score += (m.popularity || 0) * 0.01;
          return { item: m, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map((x) => x.item);

      setRecs(scored);
    } catch {}
  };

  useEffect(() => {
    computeRecs();
    return subscribeStorage(computeRecs);
  }, []);

  const openInterestPicker = () => {
    setDraftGenres(interests.genres);
    setDraftLangs(interests.langs);
    setOpenModal(true);
  };

  const toggleArr = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleSave = () => {
    saveInterests({ genres: draftGenres, langs: draftLangs });
    setOpenModal(false);
  };

  if (!recs.length) return null;

  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">
          <span className="sec-bar" />
          <SparklesIcon size={18} />
          {t('pickedForYou')}
        </h2>
        <button type="button" className="sec-more" onClick={openInterestPicker}>
          <PlusIcon size={14} /> {t('addInterests')}
        </button>
      </div>

      <div className="row-track">
        {recs.map((m) => (
          <Card key={m.id} m={m} />
        ))}
      </div>

      {openModal && (
        <div className="modal-overlay" onClick={() => setOpenModal(false)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>Personalize Your Feed</strong>
              <button type="button" className="modal-close" onClick={() => setOpenModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 13.5, color: 'var(--dim)', marginBottom: 14 }}>
                Select your favorite genres and languages. Recommendations adapt instantly along with your watch history.
              </p>

              <div className="int-label">Favorite Genres</div>
              <div className="int-grid">
                {GENRES.map((g) => (
                  <button
                    key={g.slug}
                    type="button"
                    className={`chip ${draftGenres.includes(g.name) ? 'active' : ''}`}
                    onClick={() => toggleArr(draftGenres, setDraftGenres, g.name)}
                  >
                    <GenreIcon genre={g.name} size={13} />
                    {g.name}
                  </button>
                ))}
              </div>

              <div className="int-label" style={{ marginTop: 18 }}>Preferred Languages</div>
              <div className="int-grid">
                {LANGS.slice(0, 10).map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={`chip ${draftLangs.includes(l.code) ? 'active' : ''}`}
                    onClick={() => toggleArr(draftLangs, setDraftLangs, l.code)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button type="button" className="btn btn-glass btn-sm" onClick={() => setOpenModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>Save &amp; Refresh Feed</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
