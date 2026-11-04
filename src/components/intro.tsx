'use client';
import { useEffect, useState } from 'react';

/*
  Greeting in the languages Santos speaks. Pure CSS timing (≈1.6 s), so it ends on its own even
  without JavaScript; shown once per browser session (see themeScript) and never with reduced motion.
*/
export function Intro({ words, skip }: { words: string[]; skip: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (gone) return;
    const end = () => setGone(true);
    const t = setTimeout(end, 2200);
    window.addEventListener('keydown', end, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('keydown', end); };
  }, [gone]);
  if (gone) return null;
  return (
    <div className="intro" aria-hidden="true" onClick={() => setGone(true)}>
      <div className="intro-words">
        {words.map((w, i) => (
          <span key={w} style={{ animationDelay: `${i * 0.32}s` }}>{w}</span>
        ))}
      </div>
      <button type="button" className="intro-skip" tabIndex={-1} onClick={() => setGone(true)}>{skip} →</button>
    </div>
  );
}
