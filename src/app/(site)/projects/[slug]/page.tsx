import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { reader, renderBody } from '@/lib/content';

export async function generateStaticParams() {
  const slugs = await reader.collections.projects.list();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await reader.collections.projects.read(slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await reader.collections.projects.read(slug);
  if (!p || p.hidden) notFound();
  const body = await renderBody(p.content);

  return (
    <article className="wrap detail">
      <Link href="/#projects" className="back">← All projects</Link>
      <div className="label" style={{ marginBottom: 18 }}>
        {[p.context, p.year, p.status].filter(Boolean).join(' — ')}
      </div>
      <h1>{p.title}</h1>
      <p className="lede">{p.summary}</p>

      <div className="meta-grid">
        <div><span className="label">Stack</span><span>{p.stack.join(' · ')}</span></div>
        {p.year && <div><span className="label">Year</span><span>{p.year}</span></div>}
        {p.repoUrl && <div><span className="label">Code</span><a href={p.repoUrl}>Repository ↗</a></div>}
        {p.liveUrl && <div><span className="label">Live</span><a href={p.liveUrl}>Visit ↗</a></div>}
      </div>

      {(p.video || p.cover) && (
        <figure className="detail-media">
          {p.video ? (
            <video src={p.video} poster={p.cover ?? undefined} autoPlay muted loop playsInline controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.cover!} alt={`${p.title} preview`} />
          )}
        </figure>
      )}

      <div className="prose">{body}</div>
    </article>
  );
}
