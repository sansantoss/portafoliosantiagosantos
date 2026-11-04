'use client';
import { useEffect, useRef } from 'react';
import { centreOf, switchTheme } from './theme';

/*
  The footer's landscape: Puebla seen from the west. Popocatépetl (smoking, as it does), Iztaccíhuatl
  asleep to its right, the church on top of the Cholula pyramid, the city, the cathedral towers and the
  Estrella de Puebla wheel. Light theme is day, dark theme is night (stars, Milky Way, city lights).
  The sun / moon is the theme switch. Everything is SVG + CSS: no images, nothing to download.
*/

// Small seeded random so the server and the browser draw the same stars and buildings.
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const W = 1600;
const H = 500;

const STARS = (() => {
  const r = rng(7);
  return Array.from({ length: 110 }, (_, i) => ({
    x: Math.round(r() * W),
    y: Math.round(r() * 300),
    s: +(0.5 + r() * (i % 9 === 0 ? 1.6 : 0.9)).toFixed(2),
    tw: i % 4 === 0,
    d: +(r() * 6).toFixed(2),
  }));
})();

// City skyline along the bottom, with a gap where the Cholula hill sits.
const CITY = (() => {
  const r = rng(42);
  const out: { x: number; w: number; h: number; lights: { x: number; y: number; d: number }[] }[] = [];
  let x = -10;
  while (x < W + 10) {
    const w = 14 + Math.round(r() * 30);
    const h = 10 + Math.round(r() * 38);
    const lights = [];
    for (let k = 0; k < Math.floor((w * h) / 260); k++) {
      lights.push({ x: x + 3 + Math.round(r() * (w - 6)), y: H - 12 - h + 4 + Math.round(r() * (h - 8)), d: +(r() * 5).toFixed(2) });
    }
    out.push({ x, w, h, lights });
    x += w + Math.round(r() * 3);
  }
  return out;
})();

const WHEEL = { x: 1385, y: 380, r: 46 };

type Labels = { label: string; toggle: string; hintDay: string; hintNight: string; place: string; launch: string };

export function SkyScene({ labels, caption, launchHref, children }: { labels: Labels; caption?: React.ReactNode; launchHref?: string; children?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  // Pause every animation while the landscape is off screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('paused', !e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="sky-scene paused" ref={root} data-label={labels.label}>
      <div className="sky sky-day" aria-hidden="true" />
      <div className="sky sky-night" aria-hidden="true" />
      <div className="milky" aria-hidden="true" />
      <div className="city-glow" aria-hidden="true" />

      <svg className="sky-stars" viewBox={`0 0 ${W} 300`} preserveAspectRatio="xMidYMin slice" aria-hidden="true">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} className={s.tw ? 'tw' : undefined} style={s.tw ? { animationDelay: `${s.d}s` } : undefined} />
        ))}
      </svg>
      <span className="shooting" aria-hidden="true" />

      <div className="clouds" aria-hidden="true"><i /><i /><i /></div>
      <svg className="birds" viewBox="0 0 120 40" aria-hidden="true">
        <path d="M2 14 q6 -6 12 0 q6 -6 12 0" /><path d="M40 6 q5 -5 10 0 q5 -5 10 0" /><path d="M70 22 q4 -4 8 0 q4 -4 8 0" />
      </svg>

      {/* The theme switch. */}
      <button
        type="button"
        className="celestial"
        aria-label={labels.toggle}
        onClick={(e) => switchTheme(centreOf(e.currentTarget))}
      >
        <span className="sun" aria-hidden="true" />
        <span className="moon" aria-hidden="true"><i /><i /><i /></span>
      </button>
      <span className="celestial-hint" aria-hidden="true">
        <span className="when-day">{labels.hintDay}</span>
        <span className="when-night">{labels.hintNight}</span>
      </span>

      {/* A small drone crosses the sky now and then. */}
      <svg className="mini-drone" viewBox="-20 -14 40 28" aria-hidden="true">
        <ellipse className="md-arm" cx="-13" cy="0" rx="5" ry="2.2" />
        <ellipse className="md-arm" cx="13" cy="0" rx="5" ry="2.2" />
        <circle className="md-body" r="9" />
        <circle className="md-eye" r="5" />
        <circle className="md-pupil" cx="1.5" r="2.2" />
      </svg>

      <svg className="land" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="sk-mtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--sc-mtn-top)' }} />
            <stop offset="1" style={{ stopColor: 'var(--sc-mtn-bot)' }} />
          </linearGradient>
          <clipPath id="sk-izta">
            <path d="M840 440 L960 332 Q1010 300 1060 285 Q1090 270 1120 282 Q1160 300 1200 268 Q1250 240 1300 262 Q1340 280 1380 276 Q1430 272 1470 296 L1600 350 L1600 440 Z" />
          </clipPath>
          <clipPath id="sk-izta-peaks"><path d="M1000 200 L1000 310 L1013 305 L1026 304 L1039 302 L1052 311 L1065 293 L1078 302 L1091 287 L1104 301 L1117 291 L1130 310 L1143 298 L1156 312 L1169 296 L1182 304 L1195 283 L1208 288 L1221 269 L1234 279 L1247 263 L1260 276 L1273 264 L1286 281 L1299 272 L1312 291 L1325 281 L1338 298 L1351 286 L1364 301 L1377 286 L1390 299 L1403 286 L1416 301 L1429 286 L1442 292 L1450 200 Z" /></clipPath>
          <filter id="sk-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>

        {/* far range */}
        <path className="far" d="M0 360 Q120 330 260 346 Q420 362 560 330 Q700 300 860 338 Q1020 372 1180 334 Q1340 300 1480 336 L1600 350 L1600 500 L0 500 Z" />

        {/* Iztaccíhuatl, the sleeping woman */}
        <path fill="url(#sk-mtn)" d="M840 440 L960 332 Q1010 300 1060 285 Q1090 270 1120 282 Q1160 300 1200 268 Q1250 240 1300 262 Q1340 280 1380 276 Q1430 272 1470 296 L1600 350 L1600 440 Z" />
        {/* snow: the mountain again in white, cut by a jagged line just under the ridge */}
        <g clipPath="url(#sk-izta)">
          <g clipPath="url(#sk-izta-peaks)">
            <path className="snow-fill" d="M840 440 L960 332 Q1010 300 1060 285 Q1090 270 1120 282 Q1160 300 1200 268 Q1250 240 1300 262 Q1340 280 1380 276 Q1430 272 1470 296 L1600 350 L1600 440 Z" />
          </g>
        </g>

        {/* Popocatépetl */}
        <path fill="url(#sk-mtn)" d="M150 440 L370 292 Q470 210 535 156 L548 150 L572 150 L585 156 Q650 210 750 292 L990 440 Z" />
        <path className="snow" d="M462 216 Q505 180 535 156 L548 150 L572 150 L585 156 Q615 180 658 216 L640 224 L622 208 L604 230 L588 210 L566 236 L548 211 L530 230 L512 208 L494 226 L478 212 Z" />
        <g className="smoke" filter="url(#sk-blur)">
          <circle cx="560" cy="138" r="14" /><circle cx="560" cy="138" r="18" /><circle cx="560" cy="138" r="22" /><circle cx="560" cy="138" r="16" />
        </g>

        {/* hills */}
        <path className="hill" d="M0 430 Q180 392 400 408 Q560 420 660 404 Q760 388 880 404 Q1060 426 1240 404 Q1420 384 1600 410 L1600 500 L0 500 Z" />

        {/* Cholula: the pyramid hill and the church of Los Remedios on top */}
        <g className="near">
          <path d="M590 490 Q680 410 740 398 Q770 394 800 398 Q860 410 950 490 Z" />
          <rect x="738" y="368" width="64" height="32" />
          <rect x="732" y="344" width="14" height="56" />
          <rect x="794" y="344" width="14" height="56" />
          <path d="M732 344 Q739 330 746 344 Z M794 344 Q801 330 808 344 Z" />
          <path d="M752 370 Q770 340 788 370 Z" />
          <rect x="767" y="334" width="6" height="12" />
          <rect x="769" y="324" width="2" height="10" /><rect x="766" y="327" width="8" height="2" />
        </g>
        <g className="windows">
          <rect x="736" y="352" width="4" height="6" /><rect x="798" y="352" width="4" height="6" />
          <rect x="766" y="378" width="8" height="12" rx="4" />
        </g>

        {/* the city */}
        <g className="near">
          {CITY.filter((b) => b.x + b.w < 620 || b.x > 925).map((b, i) => <rect key={i} x={b.x} y={H - 12 - b.h} width={b.w} height={b.h + 12} />)}
          {/* cathedral towers */}
          <rect x="1150" y="410" width="16" height="80" /><rect x="1206" y="410" width="16" height="80" />
          <path d="M1150 410 Q1158 392 1166 410 Z M1206 410 Q1214 392 1222 410 Z" />
          <rect x="1166" y="440" width="40" height="50" />
          <path d="M1172 440 Q1186 418 1200 440 Z" />
        </g>
        <g className="lights">
          {CITY.filter((b) => b.x + b.w < 620 || b.x > 925).flatMap((b, i) => b.lights.map((l, k) => (
            <rect key={`${i}-${k}`} x={l.x} y={l.y} width="2.4" height="2.4" className={k % 3 === 0 ? 'tw' : undefined} style={k % 3 === 0 ? { animationDelay: `${l.d}s` } : undefined} />
          )))}
        </g>

        {/* Estrella de Puebla */}
        <g className="wheel">
          <path className="near" d={`M${WHEEL.x - 22} 490 L${WHEEL.x} ${WHEEL.y} L${WHEEL.x + 22} 490 Z`} />
          <g className="wheel-spin">
            <circle className="wheel-rim" cx={WHEEL.x} cy={WHEEL.y} r={WHEEL.r} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const x = +(WHEEL.x + Math.cos(a) * WHEEL.r).toFixed(1);
              const y = +(WHEEL.y + Math.sin(a) * WHEEL.r).toFixed(1);
              return (
                <g key={i}>
                  <line className="wheel-spoke" x1={WHEEL.x} y1={WHEEL.y} x2={x} y2={y} />
                  <circle className="wheel-cab" cx={x} cy={y} r="3.2" />
                </g>
              );
            })}
          </g>
        </g>

        <rect className="near" x="0" y="488" width={W} height="12" />
      </svg>

      {caption && <p className="sky-caption">{caption}</p>}
      {/* the drone takes off from here: the way into SB-OS */}
      {launchHref && <a className="sky-launch" href={launchHref}>{labels.launch} ↗</a>}
      <div className="sky-foot">{children}</div>
    </div>
  );
}
