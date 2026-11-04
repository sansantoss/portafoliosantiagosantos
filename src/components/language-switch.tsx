'use client';
import { usePathname } from 'next/navigation';
import { beforeLocaleSwitch, locales, switchLocalePath, type Locale } from '@/i18n/config';

// EN / ES toggle that keeps you on the same page and remembers the choice for next visits.
export function LanguageSwitch({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname() || `/${lang}`;
  return (
    <span className="lang-switch" role="group" aria-label={label}>
      {locales.map((l) =>
        l === lang ? (
          <span key={l} aria-current="true" className="on">{l.toUpperCase()}</span>
        ) : (
          // A plain <a> on purpose: a full page load (see beforeLocaleSwitch).
          <a key={l} href={switchLocalePath(pathname, l)} hrefLang={l} lang={l} onClick={() => beforeLocaleSwitch(l)}>
            {l.toUpperCase()}
          </a>
        )
      )}
    </span>
  );
}
