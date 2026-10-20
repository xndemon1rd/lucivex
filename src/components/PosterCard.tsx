import { useState } from 'react';
import { Link } from '../lib/router';
import { posterHref, type Poster } from '../lib/normalize';

export default function PosterCard({ item }: { item: Poster }) {
  const [broken, setBroken] = useState(false);
  const meta = [item.season, item.episodes].filter(Boolean).join(' · ');
  return (
    <Link to={posterHref(item)} className="card" title={item.title}>
      <span className="card__art">
        {item.image && !broken ? (
          <img src={item.image} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
        ) : (
          <span className="card__fallback" aria-hidden="true">
            {item.title.charAt(0)}
          </span>
        )}
        {item.language && <span className="card__tag">{item.language}</span>}
      </span>
      <span className="card__title">{item.title}</span>
      {meta && <span className="card__meta">{meta}</span>}
    </Link>
  );
}
