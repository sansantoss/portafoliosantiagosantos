'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { droneLook } from './drone-events';
import type { Locale } from '@/i18n/config';

type Row = {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  year: string;
  context: string;
  cover: string | null;
  video: string | null;
};

type Preview = { cover: string | null; video: string | null } | null;

// Editorial list; on devices with a mouse, the project's preview (video if it has one, else its cover)
// follows the cursor.
export function ProjectList({ rows, start, lang }: { rows: Row[]; start: number; lang: Locale }) {
  const [active, setActive] = useState<Preview>(null);
  const box = useRef<HTMLDivElement>(null);

  const move = (e: React.MouseEvent) => {
    if (box.current) {
      box.current.style.left = `${e.clientX + 200}px`;
      box.current.style.top = `${e.clientY}px`;
    }
  };
  const has = active && (active.video || active.cover);

  return (
    <>
      <ul
        className="plist"
        onMouseMove={move}
        onMouseLeave={() => {
          setActive(null);
          droneLook(null);
        }}
      >
        {rows.map((p, i) => (
          <li key={p.slug} className="reveal">
            <Link
              href={`/${lang}/projects/${p.slug}`}
              className="prow"
              onMouseEnter={(e) => {
                setActive({ cover: p.cover, video: p.video });
                const r = e.currentTarget.getBoundingClientRect();
                droneLook({ x: r.left + r.width * 0.35, y: r.top + r.height / 2 });
              }}
              onFocus={() => setActive(null)}
            >
              <span className="prow-num">{String(start + i).padStart(2, '0')}</span>
              <span className="prow-main">
                <span className="prow-title">{p.title}</span>
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
