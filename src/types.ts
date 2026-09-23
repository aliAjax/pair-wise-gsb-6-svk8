export type Pair = {
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
};

export type PairSettings = Pick<
  Pair,
  'headingFont' | 'bodyFont' | 'size' | 'weight' | 'leading' | 'tracking'
>;

export const FONTS = [
  'Fraunces',
  'DM Sans',
  'Space Grotesk',
  'Newsreader',
  'IBM Plex Sans',
  'Playfair Display',
];

export const DEFAULT_SETTINGS: PairSettings = {
  headingFont: 'Fraunces',
  bodyFont: 'DM Sans',
  size: 46,
  weight: 600,
  leading: 1.25,
  tracking: 0,
};

export function settingsOf(p: Pair): PairSettings {
  return {
    headingFont: p.headingFont,
    bodyFont: p.bodyFont,
    size: p.size,
    weight: p.weight,
    leading: p.leading,
    tracking: p.tracking,
  };
}

export function sameSettings(a: PairSettings, b: PairSettings): boolean {
  return (
    a.headingFont === b.headingFont &&
    a.bodyFont === b.bodyFont &&
    a.size === b.size &&
    a.weight === b.weight &&
    a.leading === b.leading &&
    a.tracking === b.tracking
  );
}
