import { useState } from 'react';
import { apiGet } from '../lib/api';
import { humanize, normalizeEpisodes, normalizeInfo, unwrap } from '../lib/normalize';
import { Link, useRoute } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { EmptyState, ErrorState } from '../components/States';
import { MinusIcon, PlayIcon, PlusIcon } from '../components/Icons';

export default function Detail({ id }: { id: string }) {
  const { query } = useRoute();
  const [season, setSeason] = useState<number>(() => Number(query.get('season')) || 1);

  const info = useAsync(`info:${id}`, (signal, fresh) =>
    apiGet(`/api/info/${encodeURIComponent(id)}`, { signal, fresh }).then((j) => normalizeInfo(unwrap(j))),
  );
  const eps = useAsync(`eps:${id}:${season}`, (signal, fresh) =>
    apiGet(`/api/episodes/${encodeURIComponent(id)}/${season}`, { signal, fresh }).then((j) =>
      normalizeEpisodes(unwrap(j)),
    ),
  );

  const meta = info.status === 'ready' ? info.data : undefined;
  const title = meta?.title ?? humanize(id);
  const art = meta?.image ?? meta?.banner;
  const seasons = meta?.seasons ?? null;

  return (
    <div className="detail">
      {art && <div className="detail__backdrop" style={{ backgroundImage: `url("${art}")` }} />}

      <div className="detail__top page">
        {art ? (
          <img className="detail__poster" src={art} alt={title} decoding="async" />
        ) : (
          <div className="detail__poster detail__poster--blank" aria-hidden="true" />
        )}
        <div className="detail__copy">
          <h1 className="page__title">{title}</h1>
          {info.status === 'loading' && <p className="muted">Loading details…</p>}
          {meta && meta.genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {meta.genres.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          )}
          {meta?.synopsis && <p className="detail__synopsis">{meta.synopsis}</p>}
          {info.status === 'ready' && !meta?.synopsis && (
            <p className="muted">The API has no synopsis for this title.</p>
          )}
        </div>
      </div>

      <div className="page detail__body">
        {info.status === 'error' && info.error && <ErrorState error={info.error} onRetry={info.retry} />}

        {meta && meta.facts.length > 0 && (
          <dl className="facts">
            {meta.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <section aria-label="Episodes">
          <div className="episodes__head">
            <h2>Episodes</h2>
            {seasons ? (
              <div className="chiprow" role="tablist" aria-label="Seasons">
                {seasons.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    className="pill pill--sm"
                    aria-selected={s === season}
                    onClick={() => setSeason(s)}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="stepper" aria-label="Season">
                <button type="button" onClick={() => setSeason((s) => Math.max(1, s - 1))} aria-label="Previous season">
                  <MinusIcon size={18} />
                </button>
                <span>Season {season}</span>
                <button type="button" onClick={() => setSeason((s) => s + 1)} aria-label="Next season">
                  <PlusIcon size={18} />
                </button>
              </div>
            )}
          </div>

          {eps.status === 'loading' && (
            <ul className="eplist" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="skeleton sk-ep" />
              ))}
            </ul>
          )}
          {eps.status === 'error' && eps.error && <ErrorState error={eps.error} onRetry={eps.retry} />}
          {eps.status === 'ready' &&
            ((eps.data ?? []).length === 0 ? (
              <EmptyState title={`No episodes listed for season ${season}`}>
                The API returned no episodes for this season. Try another season.
              </EmptyState>
            ) : (
              <ul className="eplist">
                {eps.data!.map((ep) => {
                  const p = new URLSearchParams({ season: String(season), n: ep.number });
                  if (ep.id) p.set('ep', ep.id);
                  return (
                    <li key={ep.key}>
                      <Link to={`/watch/${encodeURIComponent(id)}?${p.toString()}`} className="ep">
                        <span className="ep__no">{ep.number}</span>
                        <span className="ep__title">{ep.title}</span>
                        <PlayIcon size={18} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}
        </section>
      </div>
    </div>
  );
}
