import type { PlanetOptions, World } from './planet-shader';

// type: 0 terrestrial, 1 desert, 2 lava, 3 ice, 4 rock, 5 gas
export const WORLDS: World[] = [
  { id: 'atl', name: 'Atl', kind: 'Ocean world', kindEs: 'Mundo oceánico', meaning: 'water', meaningEs: 'agua', type: 0, seed: 11,
    pal: ['#06204a', '#1a6fa8', '#3f8f5a', '#7c8f4e', '#d8d2b8'], sea: 0.62, scale: 1.6, clouds: 0.75, cloud: '#ffffff', atmo: '#5fa8ff', atmoS: 1.1, caps: 0.82 },
  { id: 'tonatiuh', name: 'Tonatiuh', kind: 'Dune desert', kindEs: 'Desierto de dunas', meaning: 'sun', meaningEs: 'sol', type: 1, seed: 23,
    pal: ['#6b3a1c', '#a8622d', '#d39a55', '#e9c88a', '#f6e6c4'], sea: 0, scale: 1.4, clouds: 0.08, cloud: '#f3e3c8', atmo: '#ffb36b', atmoS: 0.6 },
  { id: 'popoca', name: 'Popoca', kind: 'Lava world', kindEs: 'Mundo de lava', meaning: 'the one that smokes', meaningEs: 'el que humea', type: 2, seed: 37,
    pal: ['#0d0a0a', '#1d1412', '#2f201a', '#46302a', '#5a3d33'], sea: 0, scale: 1.8, clouds: 0.18, cloud: '#57423c', atmo: '#ff6a2b', atmoS: 0.8, emit: '#ff7a2a', emitS: 1.6 },
  { id: 'cetl', name: 'Cetl', kind: 'Ice world', kindEs: 'Mundo helado', meaning: 'ice', meaningEs: 'hielo', type: 3, seed: 41,
    pal: ['#1f4f7a', '#5d93c4', '#c5dcf0', '#e8f1fa', '#ffffff'], sea: 0.45, scale: 1.9, clouds: 0.3, cloud: '#eef6ff', atmo: '#9fd2ff', atmoS: 1.0, caps: 0.55 },
  { id: 'xochitl', name: 'Xochitl', kind: 'Jungle', kindEs: 'Selva', meaning: 'flower', meaningEs: 'flor', type: 0, seed: 53,
    pal: ['#0b3b3a', '#1d8a7c', '#1f5c2e', '#2f7d37', '#7aa34a'], sea: 0.42, scale: 2.2, clouds: 0.55, cloud: '#f2fff8', atmo: '#ff8fc8', atmoS: 0.9, caps: 0.9 },
  { id: 'mixtli', name: 'Mixtli', kind: 'Gas giant', kindEs: 'Gigante gaseoso', meaning: 'cloud', meaningEs: 'nube', type: 5, seed: 67,
    pal: ['#e8d3b0', '#c98a52', '#f3e6cd', '#9c5a35', '#d8b48a'], sea: 0, scale: 9, clouds: 0, cloud: '#ffffff', atmo: '#ffd9a8', atmoS: 0.7, ring: 1, ringCol: '#d9c3a0', ringR: [1.32, 2.05], storm: 1 },
  { id: 'citlali', name: 'Citlali', kind: 'Ice giant', kindEs: 'Gigante de hielo', meaning: 'star', meaningEs: 'estrella', type: 5, seed: 71,
    pal: ['#1c3f8f', '#2f6bd1', '#5b97ea', '#18306e', '#8ab8f5'], sea: 0, scale: 6, clouds: 0, cloud: '#ffffff', atmo: '#7fb2ff', atmoS: 1.2, ring: 0.55, ringCol: '#b9cdf5', ringR: [1.45, 1.75] },
  { id: 'tetl', name: 'Tetl', kind: 'Rocky moon', kindEs: 'Luna rocosa', meaning: 'stone', meaningEs: 'piedra', type: 4, seed: 83,
    pal: ['#2a2830', '#46434d', '#68646f', '#8b8792', '#b4b0ba'], sea: 0, scale: 2.4, clouds: 0, cloud: '#ffffff', atmo: '#9d9aa8', atmoS: 0.15 },
  { id: 'ehecatl', name: 'Ehecatl', kind: 'Storm giant', kindEs: 'Gigante tormentoso', meaning: 'wind', meaningEs: 'viento', type: 5, seed: 97,
    pal: ['#3a1d5c', '#7a3f9e', '#c46fc0', '#24123f', '#e3a6dd'], sea: 0, scale: 7.5, clouds: 0, cloud: '#ffffff', atmo: '#c792ff', atmoS: 1.0, storm: 1 },
  { id: 'tlalli', name: 'Tlalli', kind: 'Inhabited world', kindEs: 'Mundo habitado', meaning: 'land', meaningEs: 'tierra', type: 0, seed: 101,
    pal: ['#0a2f3a', '#1f7a7a', '#8a4a2a', '#b06a3a', '#d9b37a'], sea: 0.5, scale: 1.7, clouds: 0.5, cloud: '#ffffff', atmo: '#7fd6ff', atmoS: 1.0, caps: 0.78, lights: 1 },
];

/** Stable hash of a string (FNV-1a), so a project always gets the same "random" values. */
export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * The world a project flies with. A chosen preset keeps its exact look; 'auto' (or an unknown id)
 * picks a preset and a seed from the slug, so it is "random" but the same on every visit.
 * `variant` > 0 nudges the seed so two projects on the same preset still differ.
 */
export function worldFor(slug: string, preset: string | null | undefined, moons = 0, rings = 'default', variant = 0) {
  const h = hashString(slug);
  const chosen = WORLDS.find((w) => w.id === preset);
  const world = chosen ?? WORLDS[h % WORLDS.length];
  const seed = (chosen ? world.seed : world.seed + (h % 997) / 10) + variant * 13.7;
  const resolved: PlanetOptions['rings'] =
    rings === 'none' || rings === 'rings' || rings === 'belt' || rings === 'both' ? rings : world.ring ? 'rings' : 'none';
  return { world, seed, moons: Math.max(0, Math.min(4, moons)), rings: resolved };
}
