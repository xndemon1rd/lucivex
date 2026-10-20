import { apiGet } from '../lib/api';
import { extractSource, humanize, unwrap } from '../lib/normalize';
import { Link, useRoute } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { ErrorState } from '../components/States';
import { ChevronLeft } from '../components/Icons';

export default function Watch({ id }: { id: string }) {
  const { query } = useRoute();
  const season = query.get('season');
  const n = query.get('n');
  const epId = query.get('ep');
  const requestId = epId ?? id;

  const embed = useAsync(`embed:${requestId}`, (signal, fresh) =>
    apiGet(`/api/embed/${encodeURIComponent(requestId)}`, { signal, fresh }).then((j) => unwrap(j)),
  );
  const source = embed.status === 'ready' ? extractSource(embed.data) : undefined;

  return (
    <div className="page watch">
      <Link to={`/anime/${encodeURIComponent(id)}${season ? `?season=${season}` : ''}`} className="back">
        <ChevronLeft size={18} /> {humanize(id)}
      </Link>
      <h1 className="page__title">
        {season && `Season ${season}`}
        {season && n && ' · '}
        {n && `Episode ${n}`}
        {!season && !n && 'Player'}
      </h1>

      <div className="player">
        {embed.status === 'loading' && <div className="player__msg">Asking the API for a source…</div>}
        {embed.status === 'error' && embed.error && (
          <div className="player__msg">
            <ErrorState error={embed.error} onRetry={embed.retry} />
          </div>
        )}
        {embed.status === 'ready' && !source && (
          <div className="player__msg">
            <h2>No playable source</h2>
            <p>The API's embed response did not contain a link Lucivex can play. See the raw response below.</p>
          </div>
        )}
        {source?.kind === 'iframe' && (
          <iframe
            src={source.url}
            title="Player"
            allowFullScreen
            allow="fullscreen; autoplay; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        )}
        {source?.kind === 'video' && <video src={source.url} controls playsInline />}
      </div>

      {embed.status === 'ready' && (
        <details className="raw">
          <summary>Raw embed response</summary>
          <p className="muted">
            Requested <code>/api/embed/{requestId}</code>
            {epId ? ' (episode id)' : ' (title id)'}.
          </p>
          <pre>{JSON.stringify(embed.data, null, 2).slice(0, 4000)}</pre>
        </details>
      )}
    </div>
  );
}
