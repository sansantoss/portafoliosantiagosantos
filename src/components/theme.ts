import { achieve } from './achievements';

export const THEME_KEY = 'sb-theme';

// Runs before paint so the saved theme never flashes.
// Also decides, before paint, whether the greeting intro plays (once per browser session).
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t)document.documentElement.dataset.theme=t}catch(e){}try{if(sessionStorage.getItem('sb-intro'))document.documentElement.classList.add('intro-seen');else sessionStorage.setItem('sb-intro','1')}catch(e){document.documentElement.classList.add('intro-seen')}`;

export function currentTheme(): 'light' | 'dark' {
  const root = document.documentElement;
  return (root.dataset.theme as 'light' | 'dark' | undefined) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  if (next === 'dark') achieve('night');
  window.dispatchEvent(new CustomEvent('theme:change', { detail: next }));
  return next;
}

type VT = { ready: Promise<void> };

/*
  Switch theme with the new one spreading in a circle from where you clicked (the sun, the moon,
  the header toggle). Falls back to an instant switch without View Transitions or with reduced motion.
*/
export function switchTheme(origin?: { x: number; y: number }): 'light' | 'dark' {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  if (!doc.startViewTransition || reduce || !origin) { toggleTheme(); return next; }
  const root = document.documentElement;
  root.classList.add('theme-vt');
  const vt = doc.startViewTransition(() => { toggleTheme(); });
  vt.ready
    .then(() => {
      const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
      const anim = root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }
      );
      anim.finished.finally(() => root.classList.remove('theme-vt'));
    })
    .catch(() => root.classList.remove('theme-vt'));
  return next;
}

/** Centre of an element, for switchTheme's origin. */
export const centreOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
