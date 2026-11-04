import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPosts, formatDate } from '@/lib/content';
import { hasLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Journal',
    alternates: { canonical: `/${lang}/journal`, languages: { en: '/en/journal', es: '/es/journal' } },
  };
}

export default async function JournalPage({ params }: Params) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).journal;
  const posts = await getPosts(lang);
  return (
    <section className="wrap detail">
      <div className="label" style={{ marginBottom: 18 }}>{t.label}</div>
      <h1>{t.title}</h1>
      <p className="lede">{t.lede}</p>
      {posts.length ? (
        <div className="entries" style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 26 }}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/${lang}/journal/${p.slug}`} className="entry reveal" hrefLang={p.shownIn}>
              <span className="label">
                {formatDate(p.date, lang)} — {t.kinds[p.kind] ?? p.kind}
                {p.shownIn !== lang && <span className="lang-chip">{p.shownIn.toUpperCase()}</span>}
              </span>
              <span className="entry-title" lang={p.shownIn}>{p.title}</span>
              {p.summary && <span className="entry-sum" lang={p.shownIn}>{p.summary}</span>}
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty">{t.empty}</p>
      )}
    </section>
  );
}
