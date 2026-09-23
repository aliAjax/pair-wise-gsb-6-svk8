import {DEFAULT_SETTINGS, type Pair} from './types';

const KEY = 'type-pairs';

export const seedPairs: Pair[] = [
  {
    id: 1,
    title: 'Editorial calm',
    heading: 'A slower way to see',
    body: 'Good typography creates space for ideas to breathe. Pair a confident display face with a quiet, generous text face.',
    category: 'Editorial',
    favorite: true,
    headingFont: 'Fraunces',
    bodyFont: 'DM Sans',
    size: 46,
    weight: 600,
    leading: 1.25,
    tracking: 0,
  },
  {
    id: 2,
    title: 'Studio notes',
    heading: 'Make room for the unexpected',
    body: 'A thoughtful pairing can add rhythm to even the simplest interface. Try contrast in shape, not just size.',
    category: 'Portfolio',
    favorite: false,
    headingFont: 'Playfair Display',
    bodyFont: 'Space Grotesk',
    size: 46,
    weight: 600,
    leading: 1.25,
    tracking: 0,
  },
  {
    id: 3,
    title: 'Field guide',
    heading: 'Small details, lasting impressions',
    body: 'Typography is the voice of a page. Find a combination that feels clear, warm and distinctly yours.',
    category: 'Brand',
    favorite: false,
    headingFont: 'Fraunces',
    bodyFont: 'Newsreader',
    size: 46,
    weight: 600,
    leading: 1.25,
    tracking: 0,
  },
];

/** Older saves predate per-pair font settings — fill the gaps with defaults. */
function upgrade(p: Partial<Pair>): Pair {
  return {
    id: p.id ?? Date.now(),
    title: p.title ?? 'Untitled',
    heading: p.heading ?? '',
    body: p.body ?? '',
    category: p.category ?? 'Untitled',
    favorite: Boolean(p.favorite),
    headingFont: p.headingFont ?? DEFAULT_SETTINGS.headingFont,
    bodyFont: p.bodyFont ?? DEFAULT_SETTINGS.bodyFont,
    size: p.size ?? DEFAULT_SETTINGS.size,
    weight: p.weight ?? DEFAULT_SETTINGS.weight,
    leading: p.leading ?? DEFAULT_SETTINGS.leading,
    tracking: p.tracking ?? DEFAULT_SETTINGS.tracking,
  };
}

export function loadPairs(): Pair[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed) || parsed.length === 0) return seedPairs;
    return parsed.map(upgrade);
  } catch {
    return seedPairs;
  }
}

export function savePairs(pairs: Pair[]): void {
  localStorage.setItem(KEY, JSON.stringify(pairs));
}
