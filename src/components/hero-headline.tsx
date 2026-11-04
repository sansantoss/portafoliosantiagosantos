'use client';
import { useState } from 'react';
import { achieve } from './achievements';

type Tok = { id: number; text: string; from: number };
type Labels = { show: string; hide: string; tokens: string; model: string };

/*
  The headline, plus a toggle that shows how a real LLM tokenizer (OpenAI's o200k, used by GPT-4o)
  splits it. The tokenizer (~2 MB) is only downloaded when someone asks for it.
*/
export function HeroHeadline({ start, em, end, labels }: { start: string; em: string; end: string; labels: Labels }) {
  const text = `${start} ${em} ${end}`;
  const emFrom = start.length + 1;
  const emTo = emFrom + em.length;
  const [on, setOn] = useState(false);
  const [toks, setToks] = useState<Tok[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (toks || loading) return;
    setLoading(true);
    import('gpt-tokenizer/encoding/o200k_base')
      .then(({ encode, decode }) => {
        const ids = encode(text);
        const out: Tok[] = [];
        let from = 0;
        let pending: number[] = [];
        for (const id of ids) {
          pending.push(id);
          const piece = decode(pending);
          if (piece.includes('\uFFFD')) continue; // a multi-byte character split across tokens: keep accumulating
          out.push({ id: pending.at(-1)!, text: piece, from });
          from += piece.length;
          pending = [];
        }
        setToks(out);
      })
      .catch(() => setOn(false))
      .finally(() => setLoading(false));
  };

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

  const showTokens = on && toks;
  return (
    <div className="headline">
      <h1 aria-label={text}>
        {showTokens ? (
          <span aria-hidden="true">
            {toks!.map((t, i) => (
              <span key={i} className={`tok tok-${i % 5}`} title={`#${t.id}`}>
                {piece(t)}
              </span>
            ))}
          </span>
        ) : (
          <>
            {start} <em data-glow>{em}</em> {end}
          </>
        )}
      </h1>
      <button
        type="button"
        className="tok-toggle"
        aria-pressed={on}
        onClick={() => {
          setOn((v) => !v);
          load();
          achieve('tokens');
        }}
      >
        <span className="tok-icon" aria-hidden="true">▦</span>
        {on ? labels.hide : labels.show}
        {toks && <span className="tok-count">{toks.length} {labels.tokens}</span>}
        {loading && <span className="tok-count">…</span>}
        {on && toks && <span className="tok-model">{labels.model}</span>}
      </button>
    </div>
  );
}
