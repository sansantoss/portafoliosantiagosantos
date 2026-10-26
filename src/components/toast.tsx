'use client';
import { useEffect, useState } from 'react';

// Tiny global toast: call showToast('text') from anywhere on the client.
export function showToast(text: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: text }));
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2200);
    };
    window.addEventListener('toast', on);
    return () => window.removeEventListener('toast', on);
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : <div role="status" className="sr-only" />;
}

export async function copyText(text: string, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    showToast(text);
  }
}
