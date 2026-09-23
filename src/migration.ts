import type {Pair} from './types';

export type MigrationItem = {
  pair: Pair;
  /** true when the pair's body font already equals the replacement font,
   *  so migrating would collapse heading and body into one typeface. */
  conflict: boolean;
};

export type MigrationPlan = {
  oldFont: string;
  newFont: string;
  items: MigrationItem[];
  conflictCount: number;
  canApply: boolean;
};

/** Which pairings a heading-font retirement would touch, and whether it may run. */
export function planMigration(pairs: Pair[], oldFont: string, newFont: string): MigrationPlan {
  const items = pairs
    .filter(p => p.headingFont === oldFont)
    .map(pair => ({pair, conflict: pair.bodyFont === newFont}));
  const conflictCount = items.filter(i => i.conflict).length;
  return {
    oldFont,
    newFont,
    items,
    conflictCount,
    canApply: oldFont !== newFont && items.length > 0 && conflictCount === 0,
  };
}

export type MigrationBatch = {
  id: number;
  oldFont: string;
  newFont: string;
  /** Snapshots of the records before this batch touched them — the undo payload. */
  changed: Pair[];
  at: number;
};

/**
 * All-or-nothing: an invalid plan returns the input untouched with no batch;
 * a valid one returns a fully computed new array so callers commit in a single set.
 */
export function applyMigration(
  pairs: Pair[],
  plan: MigrationPlan,
): {pairs: Pair[]; batch: MigrationBatch | null} {
  if (!plan.canApply) return {pairs, batch: null};
  const targets = new Set(plan.items.map(i => i.pair.id));
  const changed: Pair[] = [];
  const next = pairs.map(p => {
    if (!targets.has(p.id)) return p;
    changed.push({...p});
    return {...p, headingFont: plan.newFont};
  });
  return {
    pairs: next,
    batch: {id: Date.now(), oldFont: plan.oldFont, newFont: plan.newFont, changed, at: Date.now()},
  };
}

/**
 * Restores only the records this batch changed, matched by id. Pairings added
 * after the migration are not in the snapshot map and pass through untouched;
 * records deleted since are not resurrected.
 */
export function undoMigration(pairs: Pair[], batch: MigrationBatch): Pair[] {
  const before = new Map(batch.changed.map(p => [p.id, p]));
  return pairs.map(p => before.get(p.id) ?? p);
}
