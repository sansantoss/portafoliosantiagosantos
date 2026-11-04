export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const LOCALE_COOKIE = 'sb-lang';

export const hasLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);
export const otherLocale = (l: Locale): Locale => (l === 'en' ? 'es' : 'en');

/** Swap the language segment of a path: /en/journal → /es/journal */
export function switchLocalePath(pathname: string, to: Locale) {
  const parts = pathname.split('/');
  if (hasLocale(parts[1] ?? '')) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join('/') || `/${to}`;
}

/** Remember the visitor's language choice for a year (read by the proxy on the next visit). */
export function rememberLocale(to: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${to};path=/;max-age=31536000;samesite=lax`;
}

export const SWITCHED_FLAG = 'sb-switched-lang';

/*
  Switching language is a full page load, not a client-side navigation: the <html lang> and the
  root layout change, and re-rendering the root layout on the client trips React over the theme
  <script> in <head>. The flag lets the next page award the "polyglot" achievement.
*/
export function beforeLocaleSwitch(to: Locale) {
  rememberLocale(to);
  try { sessionStorage.setItem(SWITCHED_FLAG, '1'); } catch { /* storage blocked: no achievement, still switches */ }
}
