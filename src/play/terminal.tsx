'use client';
import { useEffect, useRef, useState } from 'react';

type TermLabels = Record<string, string>;
export type TermActions = {
  go: (index: number) => void;
  goHole: () => void;
  open: (index: number) => void;
  launch: () => void;
  lang: () => void;
  exit: () => void;
  used: () => void;
};
type Profile = { name: string; role: string; location: string; email: string; github: string; linkedin: string };

const COMMANDS = ['help', 'whoami', 'ls', 'projects', 'go', 'cd', 'open', 'sb-0', 'hole', 'ask', 'contact', 'launch', 'lang', 'clear', 'exit', 'studio', 'sudo', 'hola', 'hello'];

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/*
  The SB-OS terminal: a few real commands that drive the scene (travel, open a case, replay the launch)
  plus who I am and how to reach me. Tab completes, ↑/↓ walk the history, Esc closes.
*/
export function Terminal({ open, onClose, labels, projects, profile, actions }: {
  open: boolean; onClose: () => void; labels: TermLabels;
  projects: { title: string; world: string }[]; profile: Profile; actions: TermActions;
}) {
  const [lines, setLines] = useState<{ kind: 'in' | 'out'; text: string }[]>([{ kind: 'out', text: labels.hello }]);
  const [value, setValue] = useState('');
  const hist = useRef<string[]>([]);
  const hi = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [lines]);

  const find = (arg: string) => {
    const n = Number(arg);
    if (Number.isInteger(n) && n >= 1 && n <= projects.length) return n - 1;
    const a = arg.toLowerCase();
    if (!a) return -1;
    return projects.findIndex((p) => p.title.toLowerCase().includes(a) || p.world.toLowerCase().includes(a));
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    hist.current.push(cmd); hi.current = -1;
    actions.used();
    const [c0, ...rest] = cmd.split(/\s+/);
    const c = c0.toLowerCase(), arg = rest.join(' ');
    const out: string[] = [];
    switch (c) {
      case 'help': out.push(labels.help); break;
      case 'whoami': out.push(fill(labels.whoami, profile)); break;
      case 'ls': case 'projects':
        out.push(labels.ls, ...projects.map((p, i) => `  ${i + 1}  ${p.title}  ·  ${p.world}`), '  0  SB-0');
        break;
      case 'go': case 'cd': {
        if (['0', 'sb-0', 'sb0', 'hole'].includes(arg.toLowerCase())) { out.push(labels.goHole); actions.goHole(); break; }
        const i = find(arg);
        if (i < 0) out.push(labels.which); else { out.push(fill(labels.go, { t: projects[i].title })); actions.go(i); }
        break;
      }
      case 'sb-0': case 'hole': out.push(labels.goHole); actions.goHole(); break;
      case 'open': {
        const i = find(arg);
        if (i < 0) out.push(labels.which); else { out.push(fill(labels.open, { t: projects[i].title })); actions.open(i); }
        break;
      }
      case 'ask': out.push(fill(labels.ask, profile)); break;
      case 'contact': out.push(fill(labels.contact, profile)); break;
      case 'launch': out.push(labels.launch); actions.launch(); onClose(); break;
      case 'lang': out.push(labels.lang); actions.lang(); break;
      case 'exit': case 'studio': out.push(labels.exit); actions.exit(); break;
      case 'clear': setLines([]); return;
      case 'sudo': out.push(labels.sudo); break;
      case 'hola': case 'hello': out.push(labels.hola); break;
      default: out.push(fill(labels.notFound, { c }));
    }
    setLines((l) => [...l, { kind: 'in' as const, text: cmd }, ...out.map((text) => ({ kind: 'out' as const, text }))].slice(-80));
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') { run(value); setValue(''); }
    else if (e.key === 'Escape') onClose();
    else if (e.key === 'Tab') {
      e.preventDefault();
      const m = COMMANDS.filter((x) => x.startsWith(value.toLowerCase()));
      if (m.length === 1) setValue(m[0] + ' ');
      else if (m.length > 1) setLines((l) => [...l, { kind: 'out', text: m.join('  ') }]);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = hist.current;
      if (!h.length) return;
      hi.current = e.key === 'ArrowUp' ? (hi.current < 0 ? h.length - 1 : Math.max(0, hi.current - 1)) : hi.current < 0 ? -1 : hi.current + 1;
      if (hi.current >= h.length) hi.current = -1;
      setValue(hi.current < 0 ? '' : h[hi.current]);
    }
  };

  if (!open) return null;
  return (
    <div className="sbos-term" role="dialog" aria-label="Terminal" onKeyDown={(e) => e.stopPropagation()}>
      <div className="term-log" ref={log} aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className={l.kind === 'in' ? 'in' : undefined}>{l.kind === 'in' ? <><b>sb@os</b> ~ $ {l.text}</> : l.text}</p>
        ))}
      </div>
      <label className="term-input">
        <b>sb@os</b> ~ $
        <input
          ref={input} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKey}
          spellCheck={false} autoCapitalize="off" autoComplete="off" aria-label="Command"
        />
      </label>
    </div>
  );
}
