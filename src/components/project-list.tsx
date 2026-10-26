'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';

type Row = {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  year: string;
  context: string;
  cover: string | null;
};

// Editorial list; on devices with a mouse, the project's preview image follows the cursor.
export function ProjectList({ rows, start }: { rows: Row[]; start: number }) {
  const [active, setActive] = useState<string | null>(null);
  const img = useRef<HTMLImageElement>(null);

  const move = (e: React.MouseEvent) => {
    if (img.current) {
      img.current.style.left = `${e.clientX + 200}px`;
      img.current.style.top = `${e.clientY}px`;
    }
  };

  return (
    <>
      <ul className="plist" onMouseMove={move} onMouseLeave={() => setActive(null)}>
        {rows.map((p, i) => (
          <li key={p.slug} className="reveal">
            <Link
              href={`/projects/${p.slug}`}
              className="prow"
              onMouseEnter={() => setActive(p.cover)}
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={active ?? undefined} alt="" aria-hidden="true" className={`hover-preview${active ? ' on' : ''}`} />
    </>
  );
}
