export const THEME_KEY = 'sb-theme';

// Runs before paint so the saved theme never flashes.
// Also decides, before paint, whether the greeting intro plays (once per browser session).
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t)document.documentElement.dataset.theme=t}catch(e){}try{if(sessionStorage.getItem('sb-intro'))document.documentElement.classList.add('intro-seen');else sessionStorage.setItem('sb-intro','1')}catch(e){document.documentElement.classList.add('intro-seen')}`;

export function toggleTheme() {
  const root = document.documentElement;
  const current =
    root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  return next;
}
