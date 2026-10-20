const env = import.meta.env as Record<string, string | undefined>;

/** Public base URL of the backend. Empty = same-origin `/api` (dev proxy or Vercel proxy). */
export const API_BASE = (env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

/**
 * Category types offered on the Browse page. They are passed straight to
 * GET /api/category/{type}. Edit via VITE_CATEGORY_TYPES to match your backend.
 */
const rawTypes = (env.VITE_CATEGORY_TYPES ?? '').trim() || 'series,movies,anime,cartoon';
export const CATEGORY_TYPES: { type: string; label: string }[] = rawTypes
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean)
  .map((t) => ({ type: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

export const INTRO_KEY = 'lucivex.intro.seen';
export const INTRO_COOLDOWN_MS = 12 * 60 * 60 * 1000;
