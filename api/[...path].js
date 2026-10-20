// Vercel serverless proxy (optional, used when VITE_API_BASE_URL is empty).
// Forwards GET /api/* from the Lucivex site to your deployed backend so the
// browser only ever talks to its own origin. Nothing secret is exposed:
// UPSTREAM_API_URL / UPSTREAM_ORIGIN live in Vercel's server-side env.

const ALLOWED = new Set(['home', 'search', 'category', 'letter', 'info', 'episodes', 'embed', 'health']);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const upstream = (process.env.UPSTREAM_API_URL || '').trim().replace(/\/+$/, '');
  if (!upstream) {
    res.status(500).json({
      success: false,
      error: 'UPSTREAM_API_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.',
    });
    return;
  }

  const segments = [].concat(req.query.path || []).map(String);
  if (segments.length === 0 || !ALLOWED.has(segments[0])) {
    res.status(404).json({ success: false, error: 'Unknown API route' });
    return;
  }

  const incoming = new URL(req.url, 'http://local');
  incoming.searchParams.delete('path');
  const qs = incoming.searchParams.toString();
  const target = `${upstream}/api/${segments.map(encodeURIComponent).join('/')}${qs ? `?${qs}` : ''}`;

  const headers = { Accept: 'application/json' };
  const origin = (process.env.UPSTREAM_ORIGIN || '').trim().replace(/\/+$/, '');
  if (origin) {
    headers.Origin = origin;
    headers.Referer = `${origin}/`;
  }

  try {
    const r = await fetch(target, { headers, signal: AbortSignal.timeout(25000) });
    const body = Buffer.from(await r.arrayBuffer());
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    if (r.ok && segments[0] !== 'embed' && segments[0] !== 'health') {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.send(body);
  } catch (err) {
    res.status(502).json({
      success: false,
      error: `Could not reach the upstream API (${err && err.name === 'TimeoutError' ? 'timeout' : 'network error'}).`,
    });
  }
}
