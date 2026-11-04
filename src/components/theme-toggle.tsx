'use client';
import { centreOf, switchTheme } from './theme';

// Header switch: a tiny window of sky. Sun by day, moon and a couple of stars by night.
export function ThemeToggle({ label }: { label: string }) {
  return (
    <button type="button" className="theme-toggle" aria-label={label} title={label} onClick={(e) => switchTheme(centreOf(e.currentTarget))}>
      <span className="tt-sky" aria-hidden="true">
        <span className="tt-sun" />
        <span className="tt-moon" />
        <span className="tt-star a" /><span className="tt-star b" />
      </span>
    </button>
  );
}
