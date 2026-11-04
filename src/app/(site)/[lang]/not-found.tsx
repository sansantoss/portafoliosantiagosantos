import Link from 'next/link';
import { lang as rootLang } from 'next/root-params';
import { Drone } from '@/components/drone';
import { defaultLocale, hasLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function NotFound() {
  const value = await rootLang().catch(() => defaultLocale);
  const lang = hasLocale(value ?? '') ? (value as 'en' | 'es') : defaultLocale;
  const t = getDictionary(lang).notFound;
  return (
    <section className="wrap detail notfound">
      <div className="notfound-text">
        <div className="label" style={{ marginBottom: 18 }}>{t.label}</div>
        <h1>{t.title} <em className="em">{t.em}</em></h1>
        <p className="lede">{t.body}</p>
        <Link href={`/${lang}`} className="btn btn-solid">{t.back}</Link>
      </div>
      <Drone />
    </section>
  );
}
