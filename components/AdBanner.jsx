'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ADS } from '@/lib/config';

export function BannerAd({ adKey, width = 300, height = 250, scriptSrc }) {
  if (!ADS.enabled || !ADS.banners || !adKey || !scriptSrc) return null;

  const srcDoc = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;overflow:hidden;background:transparent;display:flex;justify-content:center;">
    <script type="text/javascript">
      atOptions = {
        'key' : '${adKey}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="${scriptSrc}"></script>
  </body>
</html>`;

  return (
    <div className="ad-slot" style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <iframe
        title="Advertisement"
        srcDoc={srcDoc}
        width={width}
        height={height}
        style={{ border: 0, maxWidth: '100%', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
}

export function NativeAd({ scriptUrl, containerId }) {
  const containerRef = useRef(null);
  const scriptRef = useRef(null);
  const pathname = usePathname();
  const active = ADS.enabled && ADS.banners;

  useEffect(() => {
    if (!active || !scriptUrl || !containerId || !containerRef.current || !scriptRef.current) return;
    containerRef.current.innerHTML = '';
    scriptRef.current.innerHTML = '';

    const s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    s.src = scriptUrl;
    scriptRef.current.appendChild(s);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (scriptRef.current) scriptRef.current.innerHTML = '';
    };
  }, [active, scriptUrl, containerId, pathname]);

  if (!active || !scriptUrl || !containerId) return null;

  return (
    <div className="ad-slot">
      <div ref={containerRef} id={`container-${containerId}`} />
      <div ref={scriptRef} />
    </div>
  );
}
