import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { apiGet, apiUrl, toApiError } from '../lib/api';
import { homeSections, isRec, unwrap } from '../lib/normalize';
import { resetIntro } from '../lib/motion';

interface Check {
  name: string;
  path: string;
  state: 'running' | 'ok' | 'fail';
  ms?: number;
  detail?: string;
  hint?: string;
}

async function runChecks(): Promise<Check[]> {
  const out: Check[] = [];
  for (const [name, path] of [
    ['Health', '/api/health'],
    ['Home feed', '/api/home'],
  ] as const) {
    const t0 = performance.now();
    try {
      const json = await apiGet(path, { fresh: true });
      const ms = Math.round(performance.now() - t0);
      let detail = 'OK';
      if (path === '/api/home') {
        const data = unwrap(json);
        const keys = isRec(data) ? Object.keys(data).join(', ') : Array.isArray(data) ? 'array' : typeof data;
        const sections = homeSections(data);
        detail = `Keys: ${keys}. Recognised ${sections.length} lists: ${
          sections.map((s) => `${s.title} (${s.items.length})`).join(', ') || 'none'
        }.`;
      }
      out.push({ name, path, state: 'ok', ms, detail });
    } catch (e) {
      const err = toApiError(e);
      out.push({ name, path, state: 'fail', ms: Math.round(performance.now() - t0), detail: err.message, hint: err.hint });
    }
  }
  return out;
}

export default function Status() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setChecks(await runChecks());
    setBusy(false);
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <div className="page">
      <h1 className="page__title">Status</h1>

      <dl className="facts">
        <div>
          <dt>This site</dt>
          <dd>{window.location.origin}</dd>
        </div>
        <div>
          <dt>API mode</dt>
          <dd>{API_BASE ? `Direct → ${API_BASE}` : 'Same-origin /api (dev proxy or Vercel proxy)'}</dd>
        </div>
        <div>
          <dt>Example request</dt>
          <dd>{apiUrl('/api/health')}</dd>
        </div>
      </dl>

      <ul className="checks">
        {(checks ?? [{ name: 'Health', path: '/api/health', state: 'running' as const }]).map((c) => (
          <li key={c.path} data-state={c.state}>
            <div className="checks__row">
              <strong>{c.name}</strong>
              <code>{c.path}</code>
              <span className="checks__state">
                {c.state === 'running' ? 'Checking…' : c.state === 'ok' ? `OK · ${c.ms} ms` : `Failed · ${c.ms} ms`}
              </span>
            </div>
            {c.detail && <p>{c.detail}</p>}
            {c.hint && <p className="state__hint">{c.hint}</p>}
          </li>
        ))}
      </ul>

      <div className="state__actions">
        <button type="button" className="btn btn--primary" onClick={() => void run()} disabled={busy}>
          {busy ? 'Checking…' : 'Run checks again'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            resetIntro();
            window.location.assign('/');
          }}
        >
          Replay intro
        </button>
      </div>
    </div>
  );
}
