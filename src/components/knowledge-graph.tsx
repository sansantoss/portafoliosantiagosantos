'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { achieve } from './achievements';
import { droneLook } from './drone-events';

export type GraphNode = { id: string; label: string; kind: 'project' | 'tech' | 'post'; href?: string; group?: string };
export type GraphLink = { source: string; target: string };

type SimNode = GraphNode & SimulationNodeDatum & { degree: number };
type Labels = { legendProject: string; legendTech: string; legendPost: string; hint: string };

const W = 1000, H = 520;

/*
  Projects ↔ technologies ↔ journal posts, laid out by a force simulation once on mount.
  Hover (or focus) a node to light up its connections; projects and posts open on click.
  Built from the same content the future "Ask my CV" will search over.
*/
export function KnowledgeGraph({ nodes, links, labels }: { nodes: GraphNode[]; links: GraphLink[]; labels: Labels }) {
  const [hover, setHover] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const layout = useMemo(() => {
    const deg = new Map<string, number>();
    links.forEach((l) => { deg.set(l.source, (deg.get(l.source) ?? 0) + 1); deg.set(l.target, (deg.get(l.target) ?? 0) + 1); });
    const sim: SimNode[] = nodes.map((n, i) => ({
      ...n,
      degree: deg.get(n.id) ?? 0,
      // deterministic start so the picture is the same on every visit
      x: W / 2 + Math.cos(i * 2.4) * (120 + (i % 7) * 30),
      y: H / 2 + Math.sin(i * 2.4) * (90 + (i % 5) * 25),
    }));
    const simLinks = links.map((l) => ({ ...l }));
    const s = forceSimulation(sim)
      .force('link', forceLink(simLinks).id((d) => (d as SimNode).id).distance((l) => ((l.source as unknown as SimNode).kind === 'project' ? 90 : 70)).strength(0.5))
      .force('charge', forceManyBody().strength((d) => ((d as SimNode).kind === 'project' ? -520 : -160)))
      .force('collide', forceCollide((d) => radius(d as SimNode) + 26))
      .force('x', forceX(W / 2).strength(0.05))
      .force('y', forceY(H / 2).strength(0.08))
      .force('center', forceCenter(W / 2, H / 2))
      .stop();
    for (let i = 0; i < 320; i++) s.tick();
    sim.forEach((n) => {
      n.x = Math.max(60, Math.min(W - 60, n.x ?? 0));
      n.y = Math.max(30, Math.min(H - 30, n.y ?? 0));
    });
    const byId = new Map(sim.map((n) => [n.id, n]));
    return { sim, byId };
  }, [nodes, links]);

  const neighbours = useMemo(() => {
    if (!hover) return null;
    const set = new Set([hover]);
    links.forEach((l) => { if (l.source === hover) set.add(l.target); if (l.target === hover) set.add(l.source); });
    return set;
  }, [hover, links]);

  useEffect(() => {
    if (!hover) return;
    achieve('graph');
    const n = layout.byId.get(hover);
    const r = svg.current?.getBoundingClientRect();
    if (n && r) droneLook({ x: r.left + ((n.x ?? 0) / W) * r.width, y: r.top + ((n.y ?? 0) / H) * r.height });
    return () => droneLook(null);
  }, [hover, layout]);

  return (
    <figure className="graph" onMouseLeave={() => setHover(null)}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.hint}>
        <g className="graph-links">
          {links.map((l, i) => {
            const a = layout.byId.get(l.source), b = layout.byId.get(l.target);
            if (!a || !b) return null;
            const on = neighbours?.has(l.source) && neighbours?.has(l.target) && (l.source === hover || l.target === hover);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={on ? 'on' : neighbours ? 'dim' : ''} />;
          })}
        </g>
        {layout.sim.map((n) => {
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
                <circle r={radius(n)} />
              ) : (
                <rect x={-radius(n)} y={-radius(n)} width={radius(n) * 2} height={radius(n) * 2} transform={n.kind === 'post' ? 'rotate(45)' : undefined} />
              )}
              <text y={radius(n) + 16} textAnchor="middle">{n.label}</text>
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

function radius(n: { kind: string; degree: number }) {
  if (n.kind === 'project') return 9;
  if (n.kind === 'post') return 6;
  return 4 + Math.min(5, n.degree * 1.5);
}
