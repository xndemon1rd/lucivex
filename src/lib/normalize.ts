// The backend's response shapes are only partly documented, so everything here
// is defensive: it reads what is present and never invents metadata.

export type Rec = Record<string, unknown>;
export const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

export function unwrap(json: unknown): unknown {
  return isRec(json) && 'data' in json ? json.data : json;
}

export function text(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t || undefined;
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

export function pick(rec: Rec, keys: string[]): string | undefined {
  for (const k of keys) {
    const t = text(rec[k]);
    if (t) return t;
  }
  return undefined;
}

function strList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => (isRec(x) ? pick(x, ['name', 'title', 'label']) : text(x)))
      .filter((x): x is string => !!x);
  }
  const t = text(v);
  return t ? t.split(/[,|]/).map((s) => s.trim()).filter(Boolean) : [];
}

function imageUrl(v?: string): string | undefined {
  if (!v) return undefined;
  if (v.startsWith('//')) return `https:${v}`;
  return /^(https?:\/\/|data:image\/)/i.test(v) ? v : undefined;
}

export function humanize(key: string): string {
  const s = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- posters / lists ---------- */

export interface Poster {
  id?: string;
  title: string;
  image?: string;
  type?: string;
  season?: string;
  episodes?: string;
  language?: string;
  genres: string[];
}

export function toPoster(v: unknown): Poster | null {
  if (!isRec(v)) return null;
  const title = pick(v, ['title', 'name', 'englishTitle', 'japaneseTitle']);
  if (!title) return null;
  return {
    id: pick(v, ['id', 'slug', 'animeId', '_id']),
    title,
    image: imageUrl(pick(v, ['image', 'poster', 'thumbnail', 'cover', 'img', 'poster_path'])),
    type: pick(v, ['type', 'kind']),
    season: pick(v, ['season']),
    episodes: pick(v, ['episodes', 'episode', 'eps']),
    language: pick(v, ['language', 'lang', 'audio']),
    genres: strList(v.genres ?? v.genre),
  };
}

export function posterList(data: unknown, depth = 0): Poster[] {
  if (Array.isArray(data)) {
    const items = data.map(toPoster).filter((p): p is Poster => !!p);
    return items.length > 0 && items.length >= Math.ceil(data.length / 2) ? items : [];
  }
  if (isRec(data) && depth < 3) {
    let best: Poster[] = [];
    for (const v of Object.values(data)) {
      const c = posterList(v, depth + 1);
      if (c.length > best.length) best = c;
    }
    return best;
  }
  return [];
}

export interface Section {
  key: string;
  title: string;
  items: Poster[];
}

const SECTION_TITLES: Record<string, string> = {
  newestDrops: 'Newest drops',
  newAnimeArrivals: 'New arrivals',
  cartoonSeries: 'Cartoon series',
};

export function homeSections(data: unknown): Section[] {
  if (Array.isArray(data)) {
    const items = posterList(data);
    return items.length ? [{ key: 'all', title: 'Latest', items }] : [];
  }
  const out: Section[] = [];
  const walk = (node: unknown, path: string[], depth: number) => {
    if (!isRec(node) || depth > 2) return;
    for (const [k, v] of Object.entries(node)) {
      if (Array.isArray(v)) {
        const items = posterList(v);
        if (items.length) out.push({ key: [...path, k].join('.'), title: SECTION_TITLES[k] ?? humanize(k), items });
      } else if (isRec(v)) {
        walk(v, [...path, k], depth + 1);
      }
    }
  };
  walk(data, [], 0);
  return out;
}

export function seasonNumber(s?: string): number | undefined {
  const m = s?.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

export function posterHref(p: Poster): string {
  if (!p.id) return `/search?q=${encodeURIComponent(p.title)}`;
  const s = seasonNumber(p.season);
  return `/anime/${encodeURIComponent(p.id)}${s ? `?season=${s}` : ''}`;
}

/* ---------- details ---------- */

export interface Info {
  title?: string;
  image?: string;
  banner?: string;
  synopsis?: string;
  genres: string[];
  facts: { label: string; value: string }[];
  seasons: number[] | null;
}

const SKIP_FACT = /(^|_)(id|slug)$|url|link|image|poster|banner|cover|thumbnail|img|description|synopsis|overview|plot|summary|genres?$|seasons?$|episodes?$|^title$|^name$/i;

function seasonsOf(v: unknown): number[] | null {
  if (typeof v === 'number' && v >= 1 && v <= 60) return Array.from({ length: v }, (_, i) => i + 1);
  if (Array.isArray(v) && v.length) {
    const nums = v
      .map((x) => {
        if (typeof x === 'number') return x;
        const t = isRec(x) ? pick(x, ['season', 'number', 'seasonNumber', 'id', 'name']) : text(x);
        const m = t?.match(/\d+/);
        return m ? Number(m[0]) : NaN;
      })
      .filter((n) => Number.isFinite(n) && n >= 0);
    const uniq = [...new Set(nums)].sort((a, b) => a - b);
    return uniq.length ? uniq : null;
  }
  return null;
}

export function normalizeInfo(data: unknown): Info {
  let rec: Rec = isRec(data) ? data : {};
  for (const k of ['info', 'anime', 'details', 'result']) {
    const inner = rec[k];
    if (isRec(inner)) {
      rec = { ...rec, ...inner };
      break;
    }
  }

  const facts: { label: string; value: string }[] = [];
  for (const [k, v] of Object.entries(rec)) {
    if (facts.length >= 10) break;
    if (SKIP_FACT.test(k)) continue;
    let value: string | undefined;
    if (Array.isArray(v)) {
      const l = strList(v);
      if (l.length && l.length <= 6) value = l.join(', ');
    } else {
      value = text(v);
    }
    if (value && value.length <= 160) facts.push({ label: humanize(k), value });
  }

  return {
    title: pick(rec, ['title', 'name']),
    image: imageUrl(pick(rec, ['image', 'poster', 'thumbnail', 'poster_path'])),
    banner: imageUrl(pick(rec, ['banner', 'backdrop', 'background', 'cover'])),
    synopsis: pick(rec, ['description', 'synopsis', 'overview', 'plot', 'summary']),
    genres: strList(rec.genres ?? rec.genre),
    facts,
    seasons: seasonsOf(rec.seasons ?? rec.seasonList ?? rec.totalSeasons ?? rec.number_of_seasons),
  };
}

/* ---------- episodes ---------- */

export interface Episode {
  key: string;
  id?: string;
  number: string;
  title: string;
  image?: string;
}

function bestRecordArray(data: unknown, depth: number): Rec[] {
  if (Array.isArray(data)) return data.filter(isRec);
  if (isRec(data) && depth < 3) {
    let best: Rec[] = [];
    for (const v of Object.values(data)) {
      const c = bestRecordArray(v, depth + 1);
      if (c.length > best.length) best = c;
    }
    return best;
  }
  return [];
}

export function normalizeEpisodes(data: unknown): Episode[] {
  return bestRecordArray(data, 0).map((r, i) => {
    const number = pick(r, ['number', 'episode', 'ep', 'episodeNumber', 'episode_number', 'no']) ?? String(i + 1);
    const id = pick(r, ['id', 'slug', 'episodeId', 'episode_id']);
    return {
      key: `${id ?? number}-${i}`,
      id,
      number,
      title: pick(r, ['title', 'name', 'episodeTitle']) ?? `Episode ${number}`,
      image: imageUrl(pick(r, ['image', 'thumbnail', 'poster', 'still'])),
    };
  });
}

/* ---------- playback source ---------- */

export interface Source {
  url: string;
  kind: 'iframe' | 'video';
}

export function extractSource(data: unknown): Source | undefined {
  const found: { key: string; url: string }[] = [];
  const walk = (v: unknown, key: string, depth: number) => {
    if (depth > 5) return;
    if (typeof v === 'string') {
      const m = v.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (m) {
        found.push({ key: 'iframe', url: m[1] });
        return;
      }
      if (/^(https?:)?\/\//i.test(v.trim()) && /embed|iframe|player|url|src|link|stream|file/i.test(key)) {
        found.push({ key, url: v.trim() });
      }
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, key, depth + 1));
    else if (isRec(v)) for (const [k, x] of Object.entries(v)) walk(x, k, depth + 1);
  };
  walk(data, '', 0);
  const hit = found.find((f) => f.key === 'iframe') ?? found.find((f) => /embed|iframe/i.test(f.key)) ?? found[0];
  if (!hit) return undefined;
  const url = hit.url.startsWith('//') ? `https:${hit.url}` : hit.url;
  if (!/^https?:\/\//i.test(url)) return undefined;
  return { url, kind: /\.(mp4|webm|m3u8)(\?|#|$)/i.test(url) ? 'video' : 'iframe' };
}

/* ---------- search suggestions ---------- */

export function toSuggestions(data: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: unknown, depth: number) => {
    if (depth > 3 || out.size >= 8) return;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t && t.length < 80) out.add(t);
    } else if (Array.isArray(v)) {
      v.forEach((x) => walk(x, depth + 1));
    } else if (isRec(v)) {
      const t = pick(v, ['title', 'name', 'text', 'suggestion', 'label']);
      if (t) out.add(t);
      else Object.values(v).forEach((x) => walk(x, depth + 1));
    }
  };
  walk(data, 0);
  return [...out].slice(0, 6);
}
