import { useState } from 'react';
import { apiGet } from '../lib/api';
import { normalizeInfo, posterHref, unwrap, type Poster } from '../lib/normalize';
import { useAsync } from '../lib/useAsync';
import { Link } from '../lib/router';

export default function Hero({ items, label }: { items: Poster[]; label: string }) {
  const [idx, setIdx] = useState(0);
  const cur = items[idx] ?? items[0];
  const id = cur?.id;

  // The home endpoint carries no synopsis, so ask the info endpoint. Failure is silent here.
  const info = useAsync(id ? `hero-info:${id}` : null, (signal, fresh) =>
    apiGet(`/api/info/${encodeURIComponent(id as string)}`, { signal, fresh }).then((j) => normalizeInfo(unwrap(j))),
  );
  const synopsis = info.status === 'ready' ? info.data?.synopsis : undefined;
  const genres = info.status === 'ready' ? info.data?.genres ?? [] : [];

  if (!cur) return null;
  const meta = [cur.season, cur.episodes].filter(Boolean).join(' · ');

  return (
    <section className="hero" aria-label="Featured">
      {cur.image && <div className="hero__backdrop" style={{ backgroundImage: `url("${cur.image}")` }} />}
      <div className="hero__stage" key={`${idx}-${cur.id ?? cur.title}`}>
        <div className="halo" aria-hidden="true" />
        {cur.image ? (
          <img className="hero__poster" src={cur.image} alt={cur.title} decoding="async" />
        ) : (
          <div className="hero__poster hero__poster--blank" aria-hidden="true" />
        )}
      </div>

      <div className="hero__copy">
        <p className="hero__label">{label}</p>
        <h1 className="hero__title">{cur.title}</h1>
        {meta && <p className="hero__meta">{meta}</p>}
        {genres.length > 0 && (
          <ul className="chips" aria-label="Genres">
            {genres.slice(0, 5).map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
        {synopsis && <p className="hero__desc">{synopsis}</p>}
        <div className="hero__cta">
          <Link to={posterHref(cur)} className="btn btn--primary">
            Explore
          </Link>
        </div>
      </div>

      {items.length > 1 && (
        <div className="hero__rail" role="group" aria-label="Choose a featured title">
          {items.slice(0, 6).map((it, i) => (
            <button
              type="button"
              key={`${it.id ?? it.title}-${i}`}
              aria-pressed={i === idx}
              aria-label={it.title}
              onClick={() => setIdx(i)}
            >
              {it.image ? <img src={it.image} alt="" loading="lazy" decoding="async" /> : <span>{it.title.charAt(0)}</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
