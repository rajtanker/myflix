'use client';
import { useRef } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons';

export default function CarouselRow({ title, items = [], viewAllHref = '', ranked = false }) {
  const trackRef = useRef(null);

  if (!items.length) return null;

  const scroll = (dir) => {
    if (!trackRef.current) return;
    const step = Math.max(trackRef.current.clientWidth * 0.78, 320);
    trackRef.current.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-title">
          <span className="sec-bar" />
          {title}
        </h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="sec-more">
            View All <ChevronRightIcon size={15} />
          </Link>
        )}
      </div>

      <div className="row-wrap">
        <button
          type="button"
          className="row-nav left"
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
        >
          <ChevronLeftIcon />
        </button>

        <div className="row-track" ref={trackRef}>
          {items.map((m, i) => (
            <Card key={m.id} m={m} rank={ranked ? i + 1 : null} />
          ))}
        </div>

        <button
          type="button"
          className="row-nav right"
          aria-label="Scroll right"
          onClick={() => scroll(1)}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </section>
  );
}
