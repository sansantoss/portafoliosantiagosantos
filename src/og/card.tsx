import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/*
  Shared pieces for the social share images (Open Graph). Rendered by next/og at build time, so the
  files are read from disk here. Satori takes .ttf/.woff, not .woff2, hence the copies in src/og.
*/
export const OG_SIZE = { width: 1200, height: 630 };

const dir = path.join(process.cwd(), 'src/og');

export async function ogFonts() {
  const [serif, serifIt, sans, mono] = await Promise.all([
    readFile(path.join(dir, 'instrument-serif-latin-400-normal.woff')),
    readFile(path.join(dir, 'instrument-serif-latin-400-italic.woff')),
    readFile(path.join(dir, 'Geist-Regular.ttf')),
    readFile(path.join(dir, 'GeistMono-Regular.ttf')),
  ]);
  return [
    { name: 'Serif', data: serif, style: 'normal' as const, weight: 400 as const },
    { name: 'Serif', data: serifIt, style: 'italic' as const, weight: 400 as const },
    { name: 'Sans', data: sans, style: 'normal' as const, weight: 400 as const },
    { name: 'Mono', data: mono, style: 'normal' as const, weight: 400 as const },
  ];
}

export async function portraitDataUrl() {
  const buf = await readFile(path.join(dir, 'portrait.jpg'));
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

export const C = { bg: '#f2f2ef', ink: '#14161c', ink2: '#4a4c55', accent: '#1d3fbf', line: '#d6d6d0' };

/** Popocatépetl and Iztaccíhuatl, the same silhouette as the footer, as a strip along the bottom. */
export function Volcanoes({ width = 1200 }: { width?: number }) {
  return (
    <svg width={width} height={120} viewBox="0 0 1600 160" style={{ position: 'absolute', left: 0, bottom: 0 }}>
      <path fill="#a3b9d4" d="M0 120 Q120 98 260 108 Q420 120 560 96 Q700 74 860 102 Q1020 128 1180 100 Q1340 76 1480 102 L1600 110 L1600 160 L0 160 Z" />
      <path fill="#6f8bb0" d="M840 160 L960 92 Q1010 60 1060 45 Q1090 30 1120 42 Q1160 60 1200 28 Q1250 0 1300 22 Q1340 40 1380 36 Q1430 32 1470 56 L1600 110 L1600 160 Z" />
      <path fill="#6f8bb0" d="M150 160 L370 80 Q470 40 535 14 L548 8 L572 8 L585 14 Q650 40 750 80 L990 160 Z" />
      <path fill="#f7f9fc" d="M500 30 Q520 20 535 14 L548 8 L572 8 L585 14 Q600 20 620 30 L606 36 L592 28 L578 40 L562 30 L548 42 L534 30 L518 38 Z" />
      <path fill="#1d2a40" d="M0 150 Q300 128 560 140 Q680 146 760 120 Q800 112 840 120 Q920 146 1100 138 Q1350 128 1600 146 L1600 160 L0 160 Z" />
    </svg>
  );
}
