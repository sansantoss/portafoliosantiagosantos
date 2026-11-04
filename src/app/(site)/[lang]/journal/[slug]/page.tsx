import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPost, reader, renderBody, formatDate } from '@/lib/content';
import { hasLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  const all = await reader.collections.posts.all();
  const slugs = all.filter((p) => !p.entry.draft).map((p) => p.slug);
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const p = await getPost(lang, slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/${lang}/journal/${slug}`, languages: { en: `/en/journal/${slug}`, es: `/es/journal/${slug}` } },
  };
}

export default async function PostPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const p = await getPost(lang, slug);
  if (!p) notFound();
  const t = getDictionary(lang).journal;
  const body = await renderBody(p.body);

  return (
    <article className="wrap detail" lang={p.shownIn}>
      <Link href={`/${lang}/journal`} className="back" lang={lang}>← {t.back}</Link>
      <div className="label" style={{ marginBottom: 18 }} lang={lang}>
        {formatDate(p.date, lang)} — {t.kinds[p.kind] ?? p.kind}
      </div>
      {p.shownIn !== lang && <p className="lang-note" lang={lang}>{t.onlyIn}</p>}
      <h1>{p.title}</h1>
      {p.summary && <p className="lede">{p.summary}</p>}
      <div className="prose" style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 32 }}>{body}</div>
    </article>
  );
}
