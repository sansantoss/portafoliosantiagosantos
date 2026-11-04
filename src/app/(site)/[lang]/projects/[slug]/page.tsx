import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProject, reader, renderBody } from '@/lib/content';
import { hasLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await reader.collections.projects.list();
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const p = await getProject(lang, slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/${lang}/projects/${slug}`, languages: { en: `/en/projects/${slug}`, es: `/es/projects/${slug}` } },
    openGraph: p.cover ? { images: [p.cover] } : undefined,
  };
}

export default async function ProjectPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const p = await getProject(lang, slug);
  if (!p) notFound();
  const t = getDictionary(lang).projects;
  const body = await renderBody(p.body);
  const actions = [
    p.demoUrl && { href: p.demoUrl, label: t.tryIt, solid: true },
    p.liveUrl && { href: p.liveUrl, label: t.visit, solid: !p.demoUrl },
    p.repoUrl && { href: p.repoUrl, label: t.repo, solid: false },
  ].filter(Boolean) as { href: string; label: string; solid: boolean }[];

  return (
    <article className="wrap detail">
      <Link href={`/${lang}#projects`} className="back">← {t.all}</Link>
      <div className="label" style={{ marginBottom: 18 }}>
        {[p.context, p.year, p.status].filter(Boolean).join(' — ')}
      </div>
      <h1>{p.title}</h1>
      <p className="lede">{p.summary}</p>

      {actions.length > 0 && (
        <div className="hero-actions" style={{ marginBottom: 40 }}>
          {actions.map((a) => (
            <a key={a.href} href={a.href} className={`btn${a.solid ? ' btn-solid' : ''}`} target="_blank" rel="noopener">
              {a.label} ↗
            </a>
          ))}
        </div>
      )}

      <div className="meta-grid">
        <div><span className="label">{t.stack}</span><span>{p.stack.join(' · ')}</span></div>
        {p.year && <div><span className="label">{t.year}</span><span>{p.year}</span></div>}
        {p.demoUrl && <div><span className="label">{t.demo}</span><a href={p.demoUrl} target="_blank" rel="noopener">{t.tryIt} ↗</a></div>}
        {p.liveUrl && <div><span className="label">{t.live}</span><a href={p.liveUrl} target="_blank" rel="noopener">{t.visit} ↗</a></div>}
        {p.repoUrl && <div><span className="label">{t.code}</span><a href={p.repoUrl} target="_blank" rel="noopener">{t.repo} ↗</a></div>}
      </div>

      {(p.video || p.cover) && (
        <figure className="detail-media">
          {p.video ? (
            <video src={p.video} poster={p.cover ?? undefined} autoPlay muted loop playsInline controls preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover!} alt={p.title} />
          )}
        </figure>
      )}

      <div className="prose">{body}</div>

      {p.gallery.length > 0 && (
        <section className="gallery" aria-label={t.gallery}>
          <div className="label" style={{ marginBottom: 20 }}>{t.gallery}</div>
          <div className="gallery-grid">
            {p.gallery.map((g, i) => (
              <figure key={i} className="gallery-item">
                <a href={g.image} target="_blank" rel="noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.image} alt={g.caption || `${p.title} ${i + 1}`} loading="lazy" />
                </a>
                {g.caption && <figcaption>{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
