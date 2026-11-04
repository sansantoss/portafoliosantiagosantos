'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { achieve } from './achievements';
import { droneLook } from './drone-events';

export type GraphNode = { id: string; label: string; kind: 'project' | 'tech' | 'post'; href?: string; group?: string; x: number; y: number; r: number };
export type GraphLink = { source: string; target: string };
type Labels = { legendProject: string; legendTech: string; legendPost: string; hint: string };

/*
  Projects ↔ technologies ↔ journal posts. Positions arrive already computed on the server
  (see layoutGraph in lib/content.ts). Hover or focus a node to light up its connections;
  projects and posts open on click. Built from the same content the future "Ask my CV" will search.
*/
export function KnowledgeGraph({ nodes, links, width, height, labels }: { nodes: GraphNode[]; links: GraphLink[]; width: number; height: number; labels: Labels }) {
  const [hover, setHover] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const neighbours = useMemo(() => {
    if (!hover) return null;
    const set = new Set([hover]);
    links.forEach((l) => { if (l.source === hover) set.add(l.target); if (l.target === hover) set.add(l.source); });
    return set;
  }, [hover, links]);

  useEffect(() => {
    if (!hover) return;
    achieve('graph');
    const n = byId.get(hover);
    const r = svg.current?.getBoundingClientRect();
    if (n && r) droneLook({ x: r.left + (n.x / width) * r.width, y: r.top + (n.y / height) * r.height });
    return () => droneLook(null);
  }, [hover, byId, width, height]);

  return (
    <figure className="graph" onMouseLeave={() => setHover(null)}>
      <svg ref={svg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.hint}>
        <g className="graph-links">
          {links.map((l, i) => {
            const a = byId.get(l.source), b = byId.get(l.target);
            if (!a || !b) return null;
            const on = hover && (l.source === hover || l.target === hover);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={on ? 'on' : neighbours ? 'dim' : ''} />;
          })}
        </g>
        {nodes.map((n) => {
          const dim = neighbours && !neighbours.has(n.id);
          const body = (
            <g
              className={`gnode ${n.kind}${dim ? ' dim' : ''}${hover === n.id ? ' on' : ''}`}
              transform={`translate(${n.x},${n.y})`}
              onMouseEnter={() => setHover(n.id)}
              onFocus={() => setHover(n.id)}
              onBlur={() => setHover(null)}
              tabIndex={n.href ? undefined : 0}
            >
              {n.kind === 'tech' ? (
                <circle r={n.r} />
              ) : (
                <rect x={-n.r} y={-n.r} width={n.r * 2} height={n.r * 2} transform={n.kind === 'post' ? 'rotate(45)' : undefined} />
              )}
              <text y={n.kind === 'project' ? -n.r - 10 : n.r + 16} textAnchor="middle">{n.label}</text>
            </g>
          );
          return n.href ? (
            <Link key={n.id} href={n.href} aria-label={n.label}>{body}</Link>
          ) : (
            <g key={n.id}>{body}</g>
          );
        })}
      </svg>
      <figcaption className="graph-legend">
        <span><i className="lg project" aria-hidden="true" />{labels.legendProject}</span>
        <span><i className="lg tech" aria-hidden="true" />{labels.legendTech}</span>
        {nodes.some((n) => n.kind === 'post') && <span><i className="lg post" aria-hidden="true" />{labels.legendPost}</span>}
        <span className="graph-hint">{labels.hint}</span>
      </figcaption>
    </figure>
  );
}
