import { useRef } from 'react';
import type { Poster } from '../lib/normalize';
import PosterCard from './PosterCard';
import { ChevronLeft, ChevronRight } from './Icons';

export default function Carousel({ title, items }: { title: string; items: Poster[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  return (
    <section className="rail" aria-label={title}>
      <div className="rail__head">
        <h2>{title}</h2>
        <div className="rail__arrows">
          <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="rail__track" ref={track}>
        {items.map((it, i) => (
          <PosterCard key={`${it.id ?? it.title}-${i}`} item={it} />
        ))}
      </div>
    </section>
  );
}
