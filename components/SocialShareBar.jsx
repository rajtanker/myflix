'use client';
import { useEffect, useState } from 'react';
import { SITE } from '@/lib/config';
import { ShareIcon } from '@/components/Icons';
import { showToast } from '@/lib/storage';

export default function SocialShareBar({ title, path = '/' }) {
  const [url, setUrl] = useState(`${SITE.url.replace(/\/$/, '')}${path}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
  }, [path]);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Check out "${title}" on ${SITE.name}!`);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied! Share with friends');
    } catch {}
  };

  return (
    <div className="share-bar">
      <span className="share-bar-label">
        <ShareIcon size={14} /> Share with friends:
      </span>
      <div className="share-bar-btns">
        <a
          href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-pill wa"
        >
          WhatsApp
        </a>
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-pill tg"
        >
          Telegram
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-pill fb"
        >
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-pill tw"
        >
          X / Twitter
        </a>
        <button type="button" className="share-pill copy" onClick={copyUrl}>
          Copy Link
        </button>
      </div>
    </div>
  );
}
