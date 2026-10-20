import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { posterList, toSuggestions, unwrap } from '../lib/normalize';
import { useAsync } from '../lib/useAsync';
import { useDebounce } from '../lib/useDebounce';
import { navigate, useRoute } from '../lib/router';
import PosterCard from '../components/PosterCard';
import { GridSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorState } from '../components/States';
import { CloseIcon, SearchIcon } from '../components/Icons';

export default function Search() {
  const { query } = useRoute();
  const [q, setQ] = useState(query.get('q') ?? '');
  const term = useDebounce(q.trim(), 350);
  const active = term.length >= 2;

  useEffect(() => {
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search', true);
  }, [term]);

  const results = useAsync(active ? `search:${term}` : null, (signal, fresh) =>
    apiGet(`/api/search?q=${encodeURIComponent(term)}`, { signal, fresh }).then((j) => posterList(unwrap(j))),
  );

  // Suggestions are a nicety: errors are ignored.
  const typed = useDebounce(q.trim(), 250);
  const sugg = useAsync(typed.length >= 2 ? `sugg:${typed}` : null, (signal) =>
    apiGet(`/api/search?suggestion=${encodeURIComponent(typed)}`, { signal }).then((j) => toSuggestions(unwrap(j))),
  );
  const suggestions =
    sugg.status === 'ready' ? (sugg.data ?? []).filter((s) => s.toLowerCase() !== q.trim().toLowerCase()) : [];

  return (
    <div className="page">
      <h1 className="page__title">Search</h1>
      <div className="searchbox">
        <SearchIcon size={20} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search anime by title"
          aria-label="Search anime"
          autoComplete="off"
          autoCapitalize="off"
          enterKeyHint="search"
          autoFocus
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Clear search">
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="chips chips--tap" aria-label="Suggestions">
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => setQ(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!active && (
        <EmptyState title="Find something to watch">Type at least two letters of a title.</EmptyState>
      )}
      {active && (results.status === 'loading' || q.trim() !== term) && <GridSkeleton />}
      {active && results.status === 'error' && results.error && (
        <ErrorState error={results.error} onRetry={results.retry} />
      )}
      {active && results.status === 'ready' && q.trim() === term && (
        (results.data ?? []).length === 0 ? (
          <EmptyState title={`No match for “${term}”`}>Try a shorter title or a different spelling.</EmptyState>
        ) : (
          <>
            <p className="count">{results.data!.length} results</p>
            <div className="grid">
              {results.data!.map((p, i) => (
                <PosterCard key={`${p.id ?? p.title}-${i}`} item={p} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
