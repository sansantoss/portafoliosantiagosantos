'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, rememberLocale, switchLocalePath, type Locale } from '@/i18n/config';
import { achieve } from './achievements';

// EN / ES toggle that keeps you on the same page and remembers the choice for next visits.
export function LanguageSwitch({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname() || `/${lang}`;
  return (
    <span className="lang-switch" role="group" aria-label={label}>
      {locales.map((l) =>
        l === lang ? (
          <span key={l} aria-current="true" className="on">{l.toUpperCase()}</span>
        ) : (
          <Link key={l} href={switchLocalePath(pathname, l)} hrefLang={l} lang={l} onClick={() => { rememberLocale(l); achieve('polyglot'); }}>
            {l.toUpperCase()}
          </Link>
        )
      )}
    </span>
  );
}
