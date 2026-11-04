import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, hasLocale, LOCALE_COOKIE, type Locale } from '@/i18n/config';

// Pick the language for a visitor: their last choice (cookie) first, then the browser's language.
function getLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;
  const header = request.headers.get('accept-language') ?? '';
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((r) => hasLocale(r.lang));
  return (match?.lang as Locale) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split('/')[1] ?? '';
  if (hasLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${getLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, the editor, its API and files with an extension (images, models, PDFs…).
  matcher: ['/((?!_next|api|keystatic|.*\\..*).*)'],
};
