'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Locale } from '@/i18n/config';

type Item = { slug: string; title: string | null; summary: string | null; date: string; dateLabel: string; kind: string; tags: string[]; minutes: number; shownIn: Locale };
type Labels = { kinds: Record<string, string>; all: string; min: string };

/* Journal entries with a filter by kind (write-ups, notes, essays) and tags on each entry. */
export function JournalList({ items, lang, labels }: { items: Item[]; lang: Locale; labels: Labels }) {
  const [kind, setKind] = useState('all');
  const kinds = ['all', ...['writeup', 'notes', 'essay'].filter((k) => items.some((i) => i.kind === k))];
  const shown = items.filter((i) => kind === 'all' || i.kind === kind);
  return (
    <>
      {kinds.length > 2 && (
        <div className="tabs" role="tablist">
          {kinds.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {k === 'all' ? labels.all : labels.kinds[k] ?? k}
            </button>
          ))}
        </div>
      )}
      <div className="entries" style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 26 }}>
        {shown.map((p) => (
          <Link key={p.slug} href={`/${lang}/journal/${p.slug}`} className="entry reveal" hrefLang={p.shownIn} data-spotlight>
            <span className="label">
              {p.dateLabel} — {labels.kinds[p.kind] ?? p.kind} · {p.minutes} {labels.min}
              {p.shownIn !== lang && <span className="lang-chip">{p.shownIn.toUpperCase()}</span>}
            </span>
            <span className="entry-title" lang={p.shownIn}>{p.title}</span>
            {p.summary && <span className="entry-sum" lang={p.shownIn}>{p.summary}</span>}
            {p.tags.length > 0 && (
              <span className="tags">{p.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
