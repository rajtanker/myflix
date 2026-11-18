jsx
'use client';
import { useEffect, useState } from 'react';
import { TOAST_EVENT } from '@/lib/storage';

export default function Toast() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let timer;
    const onToast = (e) => {
      setMsg(e.detail || '');
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(''), 2600);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}
