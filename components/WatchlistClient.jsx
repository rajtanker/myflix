'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import { TrashIcon } from '@/components/Icons';
import {
  getWatchlist,
  getHistory,
  clearWatchlist,
  clearHistory,
  subscribeStorage,
} from '@/lib/storage';

export default function WatchlistClient() {
  const [tab, setTab] = useState('watchlist');
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const sync = () => {
      setWatchlist(getWatchlist());
      setHistory(getHistory());
    };
    sync();
    return subscribeStorage(sync);
  }, []);

  const items = tab === 'watchlist' ? watchlist : history;

  return (
    <>
      <div className="page-banner">
        <h1>My Library</h1>
        <p>Your saved watchlist and watch history, stored privately in your browser.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`srv-btn ${tab === 'watchlist' ? 'on' : ''}`}
            onClick={() => setTab('watchlist')}
          >
            My Watchlist ({watchlist.length})
          </button>
          <button
            type="button"
            className={`srv-btn ${tab === 'history' ? 'on' : ''}`}
            onClick={() => setTab('history')}
          >
            Watch History ({history.length})
          </button>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            className="srv-btn"
            onClick={() => (tab === 'watchlist' ? clearWatchlist() : clearHistory())}
          >
            <TrashIcon /> Clear {tab === 'watchlist' ? 'Watchlist' : 'History'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-box">
          <h2>{tab === 'watchlist' ? 'Your Watchlist is Empty' : 'No Watch History Yet'}</h2>
          <p>
            {tab === 'watchlist'
              ? 'Click the + button on any movie or TV series to bookmark it for later.'
              : 'Start watching any movie or episode and it will automatically appear here.'}
          </p>
          <Link href="/browse/" className="btn btn-primary">Discover Titles</Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((m) => (
            <Card key={m.id} m={m} />
          ))}
        </div>
      )}
    </>
  );
}
