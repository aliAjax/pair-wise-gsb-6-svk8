import type { FontMigration, MigrationPlan, Pair } from './types';

export const FONT_CHOICES = [
  'Fraunces',
  'DM Sans',
  'Space Grotesk',
  'Newsreader',
  'IBM Plex Sans',
  'Playfair Display',
] as const;

export const DEFAULT_SETTINGS = {
  headingFont: 'Fraunces',
  bodyFont: 'DM Sans',
  size: 46,
  weight: 600,
  leading: 1.25,
  tracking: 0,
} as const;

function sameFont(a: string, b: string) {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/** Find every heading pairing that currently depends on the retiring font. */
export function buildMigrationPlan(
  pairs: Pair[],
  oldFont: string,
  newFont: string,
): MigrationPlan {
  const reasons: string[] = [];
  const normalizedOld = oldFont.trim();
  const normalizedNew = newFont.trim();

  if (!normalizedOld) reasons.push('请选择要停用的旧标题字体。');
  if (!normalizedNew) reasons.push('请选择替代标题字体。');
  if (normalizedOld && normalizedNew && sameFont(normalizedOld, normalizedNew)) {
    reasons.push('替代字体不能与旧字体相同。');
  }

  const affected = pairs.filter(pair => sameFont(pair.headingFont, normalizedOld));
  if (normalizedOld && affected.length === 0) {
    reasons.push('当前没有使用这款旧标题字体的配对。');
  }

  const conflicts = normalizedNew
    ? affected.filter(pair => sameFont(pair.bodyFont, normalizedNew))
    : [];

  if (conflicts.length > 0) {
    reasons.push(
      `${conflicts.length} 个配对会让标题与正文都使用 ${normalizedNew}，请先另选替代字体。`,
    );
  }

  return {
    affected,
    conflicts,
    reasons,
    canApply: reasons.length === 0,
  };
}

/**
 * Apply a heading-font migration atomically. The caller receives either complete
 * replacement records plus an archive, or null; no partial list is returned.
 */
export function applyHeadingMigration(
  pairs: Pair[],
  oldFont: string,
  newFont: string,
  now: () => Date = () => new Date(),
): { pairs: Pair[]; archive: FontMigration } | null {
  const plan = buildMigrationPlan(pairs, oldFont, newFont);
  if (!plan.canApply) return null;

  const changes = plan.affected.map(pair => ({
    id: pair.id,
    fromHeadingFont: pair.headingFont,
  }));
  const timestamp = now();

  const nextPairs = pairs.map(pair =>
    sameFont(pair.headingFont, oldFont)
      ? { ...pair, headingFont: newFont }
      : pair,
  );

  return {
    pairs: nextPairs,
    archive: {
      id: `migration-${timestamp.getTime()}`,
      createdAt: timestamp.toISOString(),
      oldFont,
      newFont,
      changes,
    },
  };
}

/** Restore only records changed by one archive; records created later stay intact. */
export function undoMigration(pairs: Pair[], archive: FontMigration): Pair[] {
  const previousFontById = new Map(
    archive.changes.map(change => [change.id, change.fromHeadingFont]),
  );

  return pairs.map(pair => {
    const previousFont = previousFontById.get(pair.id);
    return previousFont ? { ...pair, headingFont: previousFont } : pair;
  });
}
