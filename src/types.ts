export interface Pair {
  id: number;
  title: string;
  heading: string;
  body: string;
  category: string;
  favorite: boolean;
  headingFont: string;
  bodyFont: string;
  size: number;
  weight: number;
  leading: number;
  tracking: number;
}

export type PairDraft = Pick<
  Pair,
  'headingFont' | 'bodyFont' | 'size' | 'weight' | 'leading' | 'tracking'
>;

export interface MigrationChange {
  id: number;
  fromHeadingFont: string;
}

export interface FontMigration {
  id: string;
  createdAt: string;
  oldFont: string;
  newFont: string;
  changes: MigrationChange[];
}

export interface MigrationPlan {
  affected: Pair[];
  conflicts: Pair[];
  reasons: string[];
  canApply: boolean;
}
