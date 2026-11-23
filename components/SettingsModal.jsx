'use client';
import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/Icons';
import { APP_LANGUAGES, setAppLang, setPrefs, useI18n } from '@/lib/i18n';
import { clearHistory, clearWatchlist, saveInterests } from '@/lib/storage';

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const { lang, prefs } = useI18n();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('myflix:settings', onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('myflix:settings', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>App Settings &amp; Preferences</strong>
          <button type="button" className="modal-close" onClick={() => setOpen(false)}>
            <CloseIcon />
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-group">
            <label htmlFor="app-lang-select">Interface Language (Primary: English)</label>
            <select
              id="app-lang-select"
              value={lang}
              onChange={(e) => setAppLang(e.target.value)}
            >
              {APP_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <small>Translates menus, headings, buttons, and sections across the app.</small>
          </div>

          <div className="settings-toggle-row">
            <div>
              <strong>Card Hover Preview</strong>
              <small>Show trailer or quick synopsis when hovering over posters</small>
            </div>
            <input
              type="checkbox"
              checked={!!prefs.hoverPreview}
              onChange={(e) => setPrefs({ hoverPreview: e.target.checked })}
            />
          </div>

          <div className="settings-group" style={{ paddingTop: 10, borderTop: '1px solid var(--line)' }}>
            <label>Manage Local Data</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="srv-btn" onClick={clearHistory}>Clear Watch History</button>
              <button type="button" className="srv-btn" onClick={clearWatchlist}>Clear Watchlist</button>
              <button type="button" className="srv-btn" onClick={() => saveInterests({ genres: [], langs: [] })}>Reset Interests</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
