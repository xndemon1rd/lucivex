import { API_BASE } from '../config';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse' | 'api';

function hintFor(kind: ApiErrorKind, status?: number): string {
  switch (kind) {
    case 'timeout':
      return 'The API took too long to answer. Check that the backend is running and reachable, then retry.';
    case 'network':
      return API_BASE
        ? `The browser could not reach ${API_BASE}. Check the URL, that the backend is online, and that its CORS_ORIGIN includes this site's address.`
        : 'The browser could not reach /api. In development, start the backend on port 3000. In production, set UPSTREAM_API_URL on Vercel (or VITE_API_BASE_URL).';
    case 'http':
      if (status === 403)
        return "The backend refused the request (403). It checks the Origin header: add this site to the backend's CORS_ORIGIN, or use the Vercel proxy with UPSTREAM_ORIGIN (see README).";
      if (status === 404) return 'The backend has no such route or item.';
      if (status === 429) return 'Too many requests. Wait a moment and retry.';
      if (status && status >= 500) return 'The backend failed while handling the request. Check its logs.';
      return `Unexpected response (HTTP ${status ?? '?'}).`;
    case 'parse':
      return 'The API did not return JSON. A wrong API URL often returns an HTML page.';
    default:
      return 'The API reported an error.';
  }
}

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  url: string;
  hint: string;
  constructor(kind: ApiErrorKind, message: string, url: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.url = url;
    this.status = status;
    this.hint = hintFor(kind, status);
  }
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  const msg = e instanceof Error ? e.message : String(e);
  return new ApiError('network', msg, '');
}

export const apiUrl = (path: string) => `${API_BASE}${path}`;

const cache = new Map<string, { t: number; v: unknown }>();
const TTL = 60_000;

export interface GetOptions {
  signal?: AbortSignal;
  fresh?: boolean;
  timeoutMs?: number;
}

export async function apiGet(path: string, opts: GetOptions = {}): Promise<unknown> {
  const url = apiUrl(path);
  if (!opts.fresh) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.t < TTL) return hit.v;
  }

  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, opts.timeoutMs ?? 20_000);
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener('abort', onAbort);

  try {
    let res: Response;
    let body: string;
    try {
      res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      body = await res.text();
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      if (timedOut) throw new ApiError('timeout', 'Request timed out', url);
      throw new ApiError('network', 'Network request failed', url);
    }

    let json: unknown;
    let parsed = true;
    try {
      json = JSON.parse(body);
    } catch {
      parsed = false;
    }

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      if (parsed && json && typeof json === 'object') {
        const r = json as Record<string, unknown>;
        const m = r.error ?? r.message;
        if (typeof m === 'string' && m) msg = m;
      }
      throw new ApiError('http', msg, url, res.status);
    }
    if (!parsed) {
      throw new ApiError('parse', `Response was not JSON (starts with: ${body.slice(0, 60).replace(/\s+/g, ' ')})`, url);
    }
    if (json && typeof json === 'object' && (json as Record<string, unknown>).success === false) {
      const r = json as Record<string, unknown>;
      throw new ApiError('api', String(r.error ?? r.message ?? 'The API reported a failure'), url);
    }

    cache.set(url, { t: Date.now(), v: json });
    return json;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }
}
