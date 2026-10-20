import type { ReactNode } from 'react';
import type { ApiError } from '../lib/api';
import { Link } from '../lib/router';
import { AlertIcon, RetryIcon } from './Icons';

const TITLES: Record<string, string> = {
  network: "Can't reach the API",
  timeout: 'The API is not answering',
  http: 'The API returned an error',
  parse: 'The API sent something unexpected',
  api: 'The API reported a problem',
};

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <AlertIcon size={28} />
      <h2>{TITLES[error.kind] ?? 'Something went wrong'}</h2>
      <p>{error.message}</p>
      <p className="state__hint">{error.hint}</p>
      {error.url && <code className="state__url">{error.url}</code>}
      <div className="state__actions">
        {onRetry && (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            <RetryIcon size={18} /> Retry
          </button>
        )}
        <Link to="/status" className="btn">
          Run diagnostics
        </Link>
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
