'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { from: 'drone' | 'me'; text: string };

/*
  iMessage-style thread: the drone asks, Santos answers. Messages appear one by one (with a typing
  indicator) the first time the section scrolls into view; all at once with reduced motion.
*/
export function HobbyChat({ messages, droneName, meName }: { messages: Msg[]; droneName: string; meName: string }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setShown(messages.length));
      return () => cancelAnimationFrame(id);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      let t = 0;
      messages.forEach((m, i) => {
        timers.push(setTimeout(() => setTyping(true), t));
        t += 420 + Math.min(900, m.text.length * 14);
        timers.push(setTimeout(() => { setTyping(false); setShown(i + 1); }, t));
        t += 220;
      });
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [messages]);

  const next = messages[shown];
  return (
    <div ref={ref} className="chat" role="log" aria-live="polite">
      {/* Screen readers get the whole conversation right away. */}
      <ol className="sr-only">
        {messages.map((m, i) => <li key={i}>{m.from === 'drone' ? droneName : meName}: {m.text}</li>)}
      </ol>
      <div aria-hidden="true">
        {messages.slice(0, shown).map((m, i) => {
          const first = i === 0 || messages[i - 1].from !== m.from;
          return (
            <div key={i} className={`bubble-row from-${m.from}${first ? ' first' : ''}`}>
              {m.from === 'drone' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={`chat-avatar${first ? '' : ' ghost'}`} src="/models/eye-drone.webp" alt="" />
              )}
              <p className="bubble">{m.text}</p>
            </div>
          );
        })}
        {typing && next && (
          <div className={`bubble-row from-${next.from}`}>
            {next.from === 'drone' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="chat-avatar" src="/models/eye-drone.webp" alt="" />
            )}
            <p className="bubble typing"><span /><span /><span /></p>
          </div>
        )}
      </div>
    </div>
  );
}
