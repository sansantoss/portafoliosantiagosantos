import Link from 'next/link';
import { getPosts, formatDate } from '@/lib/content';

export const metadata = { title: 'Journal' };

export default async function JournalPage() {
  const posts = await getPosts();
  return (
    <section className="wrap detail">
      <div className="label" style={{ marginBottom: 18 }}>Build log</div>
      <h1>Journal</h1>
      <p className="lede">Write-ups of what I build and what I learn along the way.</p>
      {posts.length ? (
        <div className="entries" style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 26 }}>
          {posts.map((p) => (
            <Link key={p.slug} href={`/journal/${p.slug}`} className="entry reveal">
              <span className="label">{formatDate(p.date)} — {p.kind}</span>
              <span className="entry-title">{p.title}</span>
              {p.summary && <span className="entry-sum">{p.summary}</span>}
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty">First entries are on the way.</p>
      )}
    </section>
  );
}
