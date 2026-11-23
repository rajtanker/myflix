'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CloseIcon, PlayIcon } from '@/components/Icons';

const DISMISS_KEY = 'myflix_app_banner_hide_until';

export default function AppBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const isWatching = pathname?.startsWith('/movie/') || pathname?.startsWith('/tv/') || pathname?.startsWith('/shorts/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
    if (isStandalone) return;

    const hideUntil = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() > hideUntil) {
      setVisible(true);
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!visible || isWatching) return null;

  const dismiss = (days = 14) => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice?.outcome === 'accepted') dismiss(90);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="app-top-banner">
        <div className="app-banner-inner">
          <div className="app-banner-left">
            <span className="app-banner-ico"><PlayIcon size={14} /></span>
            <div>
              <strong>Get the MyFlix App</strong>
              <span>Faster streaming, offline watchlist &amp; app icon on your phone</span>
            </div>
          </div>
          <div className="app-banner-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleInstall}>
              Install App
            </button>
            <button type="button" className="app-banner-close" aria-label="Dismiss" onClick={() => dismiss(14)}>
              <CloseIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-box" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>Install MyFlix App</strong>
              <button type="button" className="modal-close" onClick={() => setShowGuide(false)}>
                <CloseIcon />
              </button>
            </div>
            <div style={{ padding: 22, fontSize: 14, color: '#cbd0df', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>Install MyFlix directly to your home screen in 2 seconds:</p>
              <p><strong>Android (Chrome):</strong> Tap the <strong>⋮ Menu</strong> (top-right) → Tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>.</p>
              <p style={{ marginTop: 8 }}><strong>iPhone (Safari):</strong> Tap the <strong>Share</strong> icon → Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</p>
              <button type="button" className="btn btn-primary" style={{ marginTop: 18, width: '100%' }} onClick={() => { setShowGuide(false); dismiss(30); }}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
