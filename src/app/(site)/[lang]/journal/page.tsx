import { JournalList } from '@/components/journal-list';
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
        <JournalList
          lang={lang}
          labels={{ kinds: t.kinds, all: t.all_, min: t.min }}
          items={posts.map((p) => ({ ...p, dateLabel: formatDate(p.date, lang) }))}
        />
      ) : (
        <p className="empty">{t.empty}</p>
      )}
    </section>
  );
}
