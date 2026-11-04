'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { droneLook } from './drone-events';
import type { Locale } from '@/i18n/config';

type Row = {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  year: string;
  context: string;
  status: string;
  category: string;
  featured: boolean;
  cover: string | null;
  video: string | null;
};

type Labels = { categories: Record<string, string>; featured: string; caseStudy: string };
type Preview = { cover: string | null; video: string | null } | null;

const ORDER = ['client', 'ai', 'experiments', 'games', 'academic'];

/*
  Projects: category tabs, the featured case study as a big dark card, then the editorial list.
  With a mouse, a soft spotlight follows the cursor and the project's preview (video, else cover) floats beside it.
*/
export function ProjectList({ rows, lang, labels }: { rows: Row[]; lang: Locale; labels: Labels }) {
  const [tab, setTab] = useState('all');
  const [active, setActive] = useState<Preview>(null);
  const box = useRef<HTMLDivElement>(null);

  const tabs = useMemo(
    () => ['all', ...ORDER.filter((c) => rows.some((r) => r.category === c))],
    [rows]
  );
  const shown = rows.filter((r) => tab === 'all' || r.category === tab);
  const featured = shown.find((r) => r.featured);
  const rest = shown.filter((r) => r !== featured);

  const move = (e: React.MouseEvent) => {
    if (box.current) {
      box.current.style.left = `${e.clientX + 200}px`;
      box.current.style.top = `${e.clientY}px`;
    }
  };
  const has = active && (active.video || active.cover);

  return (
    <>
      {tabs.length > 2 && (
        <div className="tabs" role="tablist" aria-label={labels.categories.all}>
          {tabs.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={tab === c}
              className={tab === c ? 'on' : ''}
              onClick={() => setTab(c)}
            >
              {labels.categories[c] ?? c}
              <span className="count">{c === 'all' ? rows.length : rows.filter((r) => r.category === c).length}</span>
            </button>
          ))}
        </div>
      )}

      {featured && (
        <Link href={`/${lang}/projects/${featured.slug}`} className="featured" data-spotlight>
          <span className="featured-main">
            <span className="label">01 — {labels.featured}{featured.status ? ` · ${featured.status}` : ''}</span>
            <span className="featured-title">{featured.title}</span>
            <span className="featured-summary">{featured.summary}</span>
          </span>
          <span className="featured-side">
            <span>{featured.stack.join(' · ')}</span>
            <span style={{ color: 'var(--invert-ink)' }}>{labels.caseStudy} →</span>
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <ul
          className="plist"
          onMouseMove={move}
          onMouseLeave={() => {
            setActive(null);
            droneLook(null);
          }}
        >
          {rest.map((p, i) => (
            <li key={p.slug} className="reveal">
              <Link
                href={`/${lang}/projects/${p.slug}`}
                className="prow"
                data-spotlight
                onMouseEnter={(e) => {
                  setActive({ cover: p.cover, video: p.video });
                  const r = e.currentTarget.getBoundingClientRect();
                  droneLook({ x: r.left + r.width * 0.35, y: r.top + r.height / 2 });
                }}
                onFocus={() => setActive(null)}
              >
                <span className="prow-num">{String((featured ? 2 : 1) + i).padStart(2, '0')}</span>
                <span className="prow-main">
                  <span className="prow-title">
                    {p.title}
                    {p.status && <span className="chip">{p.status}</span>}
                  </span>
                  <span className="prow-sum">{p.summary}</span>
                </span>
                <span className="prow-meta">
                  {p.stack.slice(0, 3).join(' · ')}
                  <br />
                  {[p.context, p.year].filter(Boolean).join(', ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div ref={box} aria-hidden="true" className={`hover-preview${has ? ' on' : ''}`}>
        {active?.video ? (
          <video key={active.video} src={active.video} poster={active.cover ?? undefined} autoPlay muted loop playsInline />
        ) : active?.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.cover} alt="" />
        ) : null}
      </div>
    </>
  );
}
