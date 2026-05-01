/* Terminal Tutor · design tokens · TypeScript / Tailwind compatible */

export const TM = {
  bg: '#1a1714',
  bgDeep: '#100e0c',
  panel: '#211d19',
  panel2: '#2a2520',
  fg: '#e8dfd2',
  dim: '#7d7066',
  rule: '#3a322b',
  amber: '#ffb454',
  amberSoft: '#cf8a3a',
  cyan: '#7dd3fc',
  green: '#9bd454',
  red: '#ef6f6c',
} as const;

export type TMColor = keyof typeof TM;

export const FONT_MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace";
