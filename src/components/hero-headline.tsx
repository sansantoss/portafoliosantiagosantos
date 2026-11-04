'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { achieve } from './achievements';
import { droneLook } from './drone-events';

type Tok = { id: number; text: string; from: number };
type Labels = { show: string; tokens: string; model: string; took: string; map: string; attends: string; itself: string; note: string };

const clean = (s: string) => s.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const isWordStart = (s: string) => /^\s/.test(s) || !/\p{L}/u.test(s);

/*
  An illustrative causal attention pattern (each token only looks back), built from simple, honest
  heuristics: itself, the token right before it, word pieces that belong together, a pull towards the
  first token (the "attention sink" real decoders show), and words that share letters. Rows sum to 1.
*/
function attention(toks: Tok[]) {
  const bigrams = (w: string) => new Set(Array.from({ length: Math.max(0, w.length - 1) }, (_, k) => w.slice(k, k + 2)));
  return toks.map((q, i) => {
    const qa = clean(q.text);
    const qb = bigrams(qa);
    const raw: number[] = [];
    for (let j = 0; j <= i; j++) {
      const k = toks[j];
      let s = 0;
      if (j === i) s += 1.0;
      if (j === 0) s += 0.9;
      if (j === i - 1) s += 0.7;
      if (j === i - 1 && !isWordStart(q.text)) s += 1.8; // the rest of the same word
      if (j < i && qa && clean(k.text)) {
        const kb = bigrams(clean(k.text));
        let shared = 0;
        qb.forEach((b) => { if (kb.has(b)) shared++; });
        s += Math.min(1.4, shared * 0.45);
      }
      if (!qa && j < i && clean(k.text).length > 3) s += 0.55; // punctuation looks back at the content
      s -= (i - j) * 0.07;
      raw.push(s);
    }
    const t = 0.5;
    const m = Math.max(...raw);
    const ex = raw.map((v) => Math.exp((v - m) / t));
    const sum = ex.reduce((a, b) => a + b, 0);
    return ex.map((v) => v / sum);
  });
}

/*
  The headline, plus a switch that shows how a real LLM tokenizer (OpenAI's o200k, used by GPT-4o)
  splits it. Tokens stream in like a model generating them; then a small attention map walks through
  them (hover to take over) and the drone follows along. The tokenizer (~2 MB) loads on demand.
*/
export function HeroHeadline({ start, em, end, labels }: { start: string; em: string; end: string; labels: Labels }) {
  const text = `${start} ${em} ${end}`;
  const emFrom = start.length + 1;
  const emTo = emFrom + em.length;
  const [on, setOn] = useState(false);
  const [toks, setToks] = useState<Tok[] | null>(null);
  const [took, setTook] = useState(0);
  const [shown, setShown] = useState(0); // how many tokens have "streamed" in
  const [q, setQ] = useState<number | null>(null); // the token doing the looking
  const [hovering, setHovering] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);

  const attn = useMemo(() => (toks ? attention(toks) : []), [toks]);
  const ready = on && toks && shown >= toks.length;

  const stream = (n: number) => {
    setShown(0);
    setQ(null);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(n); return; }
    let k = 0;
    const id = setInterval(() => {
      k++;
      setShown(k);
      if (k >= n) clearInterval(id);
    }, 85);
  };

  const toggle = () => {
    const next = !on;
    setOn(next);
    achieve('tokens');
    if (!next) { setQ(null); droneLook(null); return; }
    if (toks) { stream(toks.length); return; }
    import('gpt-tokenizer/encoding/o200k_base')
      .then(({ encode, decode }) => {
        const t0 = performance.now();
        const ids = encode(text);
        setTook(performance.now() - t0);
        const out: Tok[] = [];
        let from = 0;
        let pending: number[] = [];
        for (const id of ids) {
          pending.push(id);
          const piece = decode(pending);
          if (piece.includes('�')) continue; // a multi-byte character split across tokens: keep accumulating
          out.push({ id: pending.at(-1)!, text: piece, from });
          from += piece.length;
          pending = [];
        }
        setToks(out);
        stream(out.length);
      })
      .catch(() => setOn(false));
  };

  // Once streamed in, walk through the tokens on its own until someone hovers.
  useEffect(() => {
    if (!ready || hovering || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setQ((v) => (v === null ? 1 : (v + 1) % toks!.length)), 1300);
    return () => clearInterval(id);
  }, [ready, hovering, toks]);

  // The drone reads along.
  useEffect(() => {
    if (q === null || !h1.current) return;
    const el = h1.current.querySelector<HTMLElement>(`[data-i="${q}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    droneLook({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, [q]);
  useEffect(() => () => droneLook(null), []);

  const piece = (t: Tok) => {
    // italicise the part of a token that falls inside the emphasised word
    const a = t.from, b = t.from + t.text.length;
    const s = Math.max(a, emFrom), e = Math.min(b, emTo);
    if (s >= e) return t.text;
    return (
      <>
        {text.slice(a, s)}
        <em>{text.slice(s, e)}</em>
        {text.slice(e, b)}
      </>
    );
  };

  const row = q !== null ? attn[q] : null;
  const top = (() => {
    if (q === null || !row || !toks) return null;
    let best = q, bw = -1;
    row.forEach((w, j) => { if (j !== q && w > bw) { bw = w; best = j; } });
    if (q === 0) best = 0;
    return best;
  })();
  const maxW = row ? Math.max(...row) : 1;
  const label = (t: Tok) => `“${t.text.trim() || '␣'}”`;

  return (
    <div className={`headline${on ? ' tokens-on' : ''}`}>
      <h1 aria-label={text} ref={h1}>
        {on && toks ? (
          <span aria-hidden="true" onMouseLeave={() => setHovering(false)}>
            {toks.map((t, i) => {
              const state = i >= shown ? 'pending' : q === null ? 'idle' : i === q ? 'q' : i > q ? 'future' : 'key';
              const w = row && i <= q! ? row[i] / maxW : 0;
              return (
                <span
                  key={i}
                  data-i={i}
                  className={`tok tok-${state}`}
                  style={{ ['--w' as string]: w.toFixed(3) }}
                  title={`#${t.id}`}
                  onMouseEnter={() => { if (ready) { setHovering(true); setQ(i); } }}
                >
                  {piece(t)}
                </span>
              );
            })}
          </span>
        ) : (
          <>
            {start} <em data-glow>{em}</em> {end}
          </>
        )}
      </h1>

      <div className="tok-bar">
        <button type="button" className="tok-switch" role="switch" aria-checked={on} onClick={toggle}>
          <span className="tok-knob" aria-hidden="true" />
          {labels.show}
        </button>
        {on && toks && (
          <span className="tok-meta">
            {toks.length} {labels.tokens} · {labels.took} {took < 1 ? '<1' : took.toFixed(1)} ms · <span className="tok-model">{labels.model}</span>
          </span>
        )}
        {on && !toks && <span className="tok-meta">…</span>}
      </div>

      {on && toks && (
        <div className="attn">
          <div
            className="attn-grid"
            style={{ gridTemplateColumns: `repeat(${toks.length}, 1fr)` }}
            aria-hidden="true"
            onMouseLeave={() => setHovering(false)}
          >
            {toks.map((_, i) =>
              toks.map((__, j) => {
                const live = i < shown && j <= i;
                const w = live ? attn[i][j] / Math.max(...attn[i]) : 0;
                return (
                  <span
                    key={`${i}-${j}`}
                    className={`cell${j > i ? ' masked' : ''}${q === i ? ' row' : ''}${q !== null && q !== i ? ' dim' : ''}`}
                    style={{ ['--w' as string]: w.toFixed(3) }}
                    onMouseEnter={() => { if (ready) { setHovering(true); setQ(i); } }}
                  />
                );
              })
            )}
          </div>
          <div className="attn-text">
            <span className="label">{labels.map}</span>
            <p className="attn-cap" aria-live="polite">
              {q !== null && top !== null ? (
                <>
                  <strong>{label(toks[q])}</strong> {labels.attends} <strong>{top === q ? labels.itself : label(toks[top])}</strong>
                </>
              ) : (
                ' '
              )}
            </p>
            <p className="attn-note">{labels.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
