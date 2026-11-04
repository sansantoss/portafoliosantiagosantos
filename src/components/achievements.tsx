'use client';
import { useEffect, useState } from 'react';

/*
  Small achievements for exploring the site. Progress is a per-visitor convenience kept in this
  browser's localStorage (it can be empty or blocked; the site works the same without it).
  Anywhere on the client: achieve('palette').
*/
export const ACHIEVEMENT_IDS = [
  'hello', 'explorer', 'palette', 'polyglot', 'poke', 'backflip', 'typist', 'reader', 'contact', 'night', 'tokens', 'graph',
] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

const KEY = 'sb-achievements';
const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export function achieve(id: AchievementId) {
  if (typeof window === 'undefined') return;
  const got = read();
  if (got.includes(id)) return;
  try { localStorage.setItem(KEY, JSON.stringify([...got, id])); } catch { /* storage blocked: still show the toast */ }
  window.dispatchEvent(new CustomEvent('achievement', { detail: id }));
}

type Labels = {
  title: string; unlocked: string; close: string; locked: string;
  items: Record<string, { name: string; how: string }>;
};

export function Achievements({ labels }: { labels: Labels }) {
  const [got, setGot] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const init = requestAnimationFrame(() => setGot(read()));
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setGot(read());
      setToast(id);
      clearTimeout(t);
      t = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener('achievement', on);
    const openPanel = () => setOpen(true);
    window.addEventListener('achievements:open', openPanel);

    // Built-in triggers that need no wiring elsewhere.
    const first = setTimeout(() => achieve('hello'), 2500);
    const onScroll = () => {
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 40) achieve('explorer');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (/\/projects\//.test(location.pathname)) achieve('reader');
    return () => {
      cancelAnimationFrame(init); clearTimeout(t); clearTimeout(first);
      window.removeEventListener('achievement', on);
      window.removeEventListener('achievements:open', openPanel);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  const item = toast ? labels.items[toast] : null;
  return (
    <>
      {item && (
        <div className="ach-toast" role="status">
          <span className="ach-badge" aria-hidden="true">◆</span>
          <span>
            <span className="ach-kicker">{labels.unlocked} · {got.length}/{ACHIEVEMENT_IDS.length}</span>
            <strong>{item.name}</strong>
          </span>
        </div>
      )}
      {open && (
        <>
          <div className="cmdk-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="ach-panel" role="dialog" aria-modal="true" aria-label={labels.title} data-lenis-prevent>
            <div className="ach-head">
              <strong>{labels.title}</strong>
              <span className="mono">{got.length}/{ACHIEVEMENT_IDS.length}</span>
              <button type="button" className="esc" onClick={() => setOpen(false)}>{labels.close}</button>
            </div>
            <ul>
              {ACHIEVEMENT_IDS.map((id) => {
                const has = got.includes(id);
                const it = labels.items[id];
                return (
                  <li key={id} className={has ? 'got' : ''}>
                    <span className="ach-badge" aria-hidden="true">{has ? '◆' : '◇'}</span>
                    <span>
                      <strong>{has ? it.name : labels.locked}</strong>
                      <span className="ach-how">{it.how}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

export function AchievementsButton({ label }: { label: string }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const on = () => setN(read().length);
    const init = requestAnimationFrame(on);
    window.addEventListener('achievement', on);
    return () => { cancelAnimationFrame(init); window.removeEventListener('achievement', on); };
  }, []);
  return (
    <button type="button" className="copy" onClick={() => window.dispatchEvent(new Event('achievements:open'))}>
      {label} {n !== null && `${n}/${ACHIEVEMENT_IDS.length}`}
    </button>
  );
}
