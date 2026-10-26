import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { reader, renderBody, formatDate } from '@/lib/content';

export async function generateStaticParams() {
  const all = await reader.collections.posts.all();
  return all.filter((p) => !p.entry.draft).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await reader.collections.posts.read(slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await reader.collections.posts.read(slug);
  if (!p || p.draft) notFound();
  const body = await renderBody(p.content);

  return (
    <article className="wrap detail">
      <Link href="/journal" className="back">← Journal</Link>
      <div className="label" style={{ marginBottom: 18 }}>{p.date && formatDate(p.date)} — {p.kind}</div>
      <h1>{p.title}</h1>
      {p.summary && <p className="lede">{p.summary}</p>}
      <div className="prose" style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 32 }}>{body}</div>
    </article>
  );
}
