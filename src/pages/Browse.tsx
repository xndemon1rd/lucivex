import { useMemo, useState } from 'react';
import { CATEGORY_TYPES } from '../config';
import { apiGet } from '../lib/api';
import { posterList, unwrap } from '../lib/normalize';
import { navigate, useRoute } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import PosterCard from '../components/PosterCard';
import { GridSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorState } from '../components/States';
import { ChevronLeft, ChevronRight } from '../components/Icons';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Browse() {
  const { query } = useRoute();
  const letter = query.get('letter');
  const cat = letter ? null : query.get('cat') ?? CATEGORY_TYPES[0]?.type ?? 'series';
  const page = Math.max(1, Number(query.get('page')) || 1);

  const [genre, setGenre] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  const path = letter
    ? `/api/letter/${encodeURIComponent(letter.toLowerCase())}?page=${page}`
    : `/api/category/${encodeURIComponent(cat as string)}?page=${page}`;

  const list = useAsync(path, (signal, fresh) =>
    apiGet(path, { signal, fresh }).then((j) => posterList(unwrap(j))),
  );

  const go = (params: Record<string, string>) => {
    setGenre(null);
    setLanguage(null);
    navigate(`/browse?${new URLSearchParams(params).toString()}`);
  };

  const items = list.data ?? [];

  // Filters only appear when the API supplies the data to filter on.
  const genres = useMemo(() => [...new Set(items.flatMap((i) => i.genres))].sort(), [items]);
  const languages = useMemo(
    () => [...new Set(items.map((i) => i.language).filter((l): l is string => !!l))].sort(),
    [items],
  );
  const shown = items.filter(
    (i) => (!genre || i.genres.includes(genre)) && (!language || i.language === language),
  );

  return (
    <div className="page">
      <h1 className="page__title">Browse</h1>

      <div className="chiprow" role="tablist" aria-label="Categories">
        {CATEGORY_TYPES.map((c) => (
          <button
            key={c.type}
            type="button"
            role="tab"
            aria-selected={cat === c.type}
            className="pill"
            onClick={() => go({ cat: c.type })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="chiprow chiprow--letters" aria-label="Browse by letter">
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            className="pill pill--sm"
            aria-pressed={letter?.toUpperCase() === l}
            onClick={() => go({ letter: l })}
          >
            {l}
          </button>
        ))}
      </div>

      {(genres.length > 1 || languages.length > 1) && list.status === 'ready' && (
        <div className="filters">
          {genres.length > 1 && (
            <label>
              Genre
              <select value={genre ?? ''} onChange={(e) => setGenre(e.target.value || null)}>
                <option value="">All</option>
                {genres.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          )}
          {languages.length > 1 && (
            <label>
              Language
              <select value={language ?? ''} onChange={(e) => setLanguage(e.target.value || null)}>
                <option value="">All</option>
                {languages.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {list.status === 'loading' && <GridSkeleton />}
      {list.status === 'error' && list.error && <ErrorState error={list.error} onRetry={list.retry} />}
      {list.status === 'ready' &&
        (shown.length === 0 ? (
          <EmptyState title="Nothing here">
            {items.length === 0 ? 'This page has no titles.' : 'No titles match these filters.'}
          </EmptyState>
        ) : (
          <div className="grid">
            {shown.map((p, i) => (
              <PosterCard key={`${p.id ?? p.title}-${i}`} item={p} />
            ))}
          </div>
        ))}

      <div className="pager">
        <button
          type="button"
          className="btn"
          disabled={page <= 1}
          onClick={() => go(letter ? { letter, page: String(page - 1) } : { cat: cat as string, page: String(page - 1) })}
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          className="btn"
          disabled={list.status !== 'ready' || items.length === 0}
          onClick={() => go(letter ? { letter, page: String(page + 1) } : { cat: cat as string, page: String(page + 1) })}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
