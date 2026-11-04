'use client';
import { useEffect, useRef, useState } from 'react';
import { achieve } from './achievements';

type Skill = { name: string; category: string };
type Labels = { lede: string; cats: Record<string, string>; sound: string; on: string; off: string };

const ORDER = ['ai', 'languages', 'backend', 'frontend', 'tools'];

/* A short mechanical "thock", synthesised so there is no audio file to load. */
function makeClick() {
  let ctx: AudioContext | null = null;
  return () => {
    try {
      ctx ??= new AudioContext();
      const len = Math.floor(ctx.sampleRate * 0.045);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1700 + Math.random() * 500;
      filter.Q.value = 0.9;
      const gain = ctx.createGain();
      gain.gain.value = 0.35;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
    } catch {
      /* no audio: silently ignore */
    }
  };
}

/*
  The stack as a keyboard: every skill is a keycap. Filter by category, click keys,
  or type on your own keyboard while the section is on screen (the first key starting with that letter goes down).
*/
export function StackKeyboard({ skills, labels }: { skills: Skill[]; labels: Labels }) {
  const [cat, setCat] = useState('all');
  const [down, setDown] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const click = useRef(makeClick());

  const cats = ['all', ...ORDER.filter((c) => skills.some((s) => s.category === c))];

  const presses = useRef(0);
  const press = (name: string) => {
    setDown(name);
    if (++presses.current >= 10) achieve('typist');
    if (sound) click.current();
    setTimeout(() => setDown((d) => (d === name ? null : d)), 140);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.4 });
    io.observe(el);
    const onKey = (e: KeyboardEvent) => {
      if (!visible.current || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"], [role="dialog"]')) return;
      const k = e.key.toLowerCase();
      const hit = skills.find((s) => s.name.toLowerCase().startsWith(k));
      if (hit) press(hit.name);
    };
    window.addEventListener('keydown', onKey);
    return () => { io.disconnect(); window.removeEventListener('keydown', onKey); };
  });

  return (
    <div ref={ref} className="kb-wrap">
      <div className="kb-top">
        <div className="tabs" role="tablist">
          {cats.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
              {labels.cats[c] ?? c}
            </button>
          ))}
        </div>
        <button type="button" className="kb-sound" aria-pressed={sound} onClick={() => setSound((v) => !v)}>
          {labels.sound}: {sound ? labels.on : labels.off}
        </button>
      </div>
      <div className="kb" role="group" aria-label={labels.lede}>
        <span className="key mod" aria-hidden="true">esc</span>
        {skills.map((s) => (
          <button
            key={s.name}
            type="button"
            className={`key${down === s.name ? ' down' : ''}${cat !== 'all' && s.category !== cat ? ' dim' : ''}${cat !== 'all' && s.category === cat ? ' lit' : ''}`}
            onClick={() => press(s.name)}
          >
            <span className="key-cat">{(labels.cats[s.category] ?? s.category).slice(0, 3)}</span>
            {s.name}
          </button>
        ))}
        <span className="key mod wide" aria-hidden="true">shift</span>
        <span className="key mod space" aria-hidden="true" />
        <span className="key mod" aria-hidden="true">⌘</span>
      </div>
      <p className="kb-hint">{labels.lede}</p>
    </div>
  );
}
