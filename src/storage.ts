import { DEFAULT_SETTINGS } from './migration';
import type { FontMigration, Pair, PairDraft } from './types';

const PAIRS_KEY = 'type-pairs';
const MIGRATION_KEY = 'type-pair-font-migrations';

export const seedPairs: Pair[] = [
  {
    id: 1,
    title: 'Editorial calm',
    heading: 'A slower way to see',
    body: 'Good typography creates space for ideas to breathe. Pair a confident display face with a quiet, generous text face.',
    category: 'Editorial',
    favorite: true,
    ...DEFAULT_SETTINGS,
    headingFont: 'Fraunces',
    bodyFont: 'DM Sans',
  },
  {
    id: 2,
    title: 'Studio notes',
    heading: 'Make room for the unexpected',
    body: 'A thoughtful pairing can add rhythm to even the simplest interface. Try contrast in shape, not just size.',
    category: 'Portfolio',
    favorite: false,
    ...DEFAULT_SETTINGS,
    headingFont: 'Fraunces',
    bodyFont: 'Space Grotesk',
  },
  {
    id: 3,
    title: 'Field guide',
    heading: 'Small details, lasting impressions',
    body: 'Typography is the voice of a page. Find a combination that feels clear, warm and distinctly yours.',
    category: 'Brand',
    favorite: true,
    ...DEFAULT_SETTINGS,
    headingFont: 'Fraunces',
    bodyFont: 'Playfair Display',
  },
];

function withSettings(value: Partial<Pair>, index: number): Pair {
  return {
    id: Number(value.id ?? Date.now() + index),
    title: String(value.title ?? 'Untitled pairing'),
    heading: String(value.heading ?? 'Your new headline'),
    body: String(
      value.body ??
        'Start with a sentence that lets your type pairing show its character.',
    ),
    category: String(value.category ?? 'Untitled'),
    favorite: Boolean(value.favorite),
    headingFont: String(value.headingFont ?? DEFAULT_SETTINGS.headingFont),
    bodyFont: String(value.bodyFont ?? DEFAULT_SETTINGS.bodyFont),
    size: Number(value.size ?? DEFAULT_SETTINGS.size),
    weight: Number(value.weight ?? DEFAULT_SETTINGS.weight),
    leading: Number(value.leading ?? DEFAULT_SETTINGS.leading),
    tracking: Number(value.tracking ?? DEFAULT_SETTINGS.tracking),
  };
}

export function loadPairs(): Pair[] {
  try {
    const raw = localStorage.getItem(PAIRS_KEY);
    if (!raw) return seedPairs;
    const parsed = JSON.parse(raw) as Partial<Pair>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedPairs;
    return parsed.map(withSettings);
  } catch {
    return seedPairs;
  }
}

export function savePairs(pairs: Pair[]) {
  localStorage.setItem(PAIRS_KEY, JSON.stringify(pairs));
}

export function loadMigrations(): FontMigration[] {
  try {
    const raw = localStorage.getItem(MIGRATION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FontMigration[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMigrations(migrations: FontMigration[]) {
  localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
}

export function draftEquals(pair: Pair, draft: PairDraft) {
  return (Object.keys(draft) as (keyof PairDraft)[]).every(
    key => pair[key] === draft[key],
  );
}
