'use client';
import { useEffect, useState } from 'react';

type Item = { id: string; label: string };

/* A quiet index on the left edge: where you are on the page, and a line that fills as you scroll. */
export function SectionProgress({ items, label }: { items: Item[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const [p, setP] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const footer = document.querySelector('.site-footer');
    const onScroll = () => {
      // Step aside once the footer comes up, so it doesn't sit on top of it.
      setHidden(!!footer && footer.getBoundingClientRect().top < innerHeight * 0.6);
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? Math.min(1, scrollY / max) : 0);
      const mid = innerHeight * 0.4;
      let cur = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top < mid) cur = el.id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <nav className={`progress${hidden ? ' away' : ''}`} aria-label={label}>
      <span className="progress-line" aria-hidden="true"><span style={{ transform: `scaleY(${p})` }} /></span>
      <ol>
        {items.map((i) => (
          <li key={i.id} className={active === i.id ? 'on' : ''}>
            <a href={`#${i.id}`} aria-current={active === i.id ? 'location' : undefined}>
              <span className="pdot" aria-hidden="true" />
              <span className="progress-label">{i.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
