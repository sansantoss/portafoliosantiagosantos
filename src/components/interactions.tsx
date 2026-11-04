'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

/*
  Site-wide touches, mounted once:
  - smooth scrolling (Lenis); paused while the command palette is open
  - [data-spotlight]: a soft light that follows the cursor over cards
  - .btn / [data-magnetic]: buttons lean slightly toward the cursor
  - [data-glow]: the italic headline word lights up around the cursor
  All of it is skipped with prefers-reduced-motion; spotlight/magnet/glow only with a mouse.
*/
export function Interactions() {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;
    let lenis: Lenis | null = null;
    let raf = 0;

    if (!reduce) {
      lenis = new Lenis({ duration: 1.05, anchors: { offset: -80 }, smoothWheel: true });
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
      const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    const pause = () => lenis?.stop();
    const resume = () => lenis?.start();
    window.addEventListener('palette:open', pause);
    window.addEventListener('palette:close', resume);

    let magnet: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const spot = target?.closest?.<HTMLElement>('[data-spotlight]');
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--sx', `${e.clientX - r.left}px`);
        spot.style.setProperty('--sy', `${e.clientY - r.top}px`);
      }
      document.querySelectorAll<HTMLElement>('[data-glow]').forEach((g) => {
        const r = g.getBoundingClientRect();
        g.style.setProperty('--gx', `${e.clientX - r.left}px`);
        g.style.setProperty('--gy', `${e.clientY - r.top}px`);
      });
      const m = target?.closest?.<HTMLElement>('.btn, [data-magnetic]') ?? null;
      if (magnet && magnet !== m) magnet.style.transform = '';
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        m.style.transform = `translate(${dx * 6}px, ${dy * 5}px)`;
      }
    };
    const onLeave = () => { if (magnet) magnet.style.transform = ''; magnet = null; };
    if (fine && !reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      window.removeEventListener('palette:open', pause);
      window.removeEventListener('palette:close', resume);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return null;
}
