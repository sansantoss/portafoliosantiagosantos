'use client';
import { useEffect, useState } from 'react';

// Live time in Puebla (America/Mexico_City), rendered after mount to avoid a server/client mismatch.
export function PueblaClock({ lang }: { lang: 'en' | 'es' }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City', hour12: lang === 'en',
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [lang]);
  return <span className="clock" suppressHydrationWarning>{now ?? '--:--'}</span>;
}
