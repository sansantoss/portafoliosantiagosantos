'use client';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chat, Copy, Doc, Download, External, Folder, Search, Sun, Arrow } from './icons';
import { copyText, showToast } from './toast';
import { toggleTheme } from './theme';
import { droneCelebrate, droneLook } from './drone-events';

type Item = { slug: string; title: string; hint?: string };
type Props = {
  projects: Item[];
  posts: Item[];
  email: string;
  github?: string | null;
  linkedin?: string | null;
  cvFile?: string | null;
};

export function openPalette() {
  window.dispatchEvent(new Event('open-palette'));
}

export function PaletteButton() {
  return (
    <button type="button" className="kbd-btn" onClick={openPalette} aria-label="Open command menu">
      ⌘K
    </button>
  );
}

export function CommandPalette({ projects, posts, email, github, linkedin, cvFile }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement;
    setQuery('');
    setOpen(true);
    droneLook({ x: window.innerWidth / 2, y: window.innerHeight * 0.22 });
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    droneLook(null);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) close();
        else show();
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        show();
      } else if (e.key === 'Escape' && open) {
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-palette', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-palette', show);
    };
  }, [open, show, close]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    droneLook(null);
    fn();
  };
  const go = (href: string) => run(() => router.push(href));
  const ext = (href: string) => run(() => window.open(href, '_blank', 'noopener'));

  if (!open) return null;

  return (
    <>
      <div className="cmdk-overlay" onClick={close} aria-hidden="true" />
      <div className="cmdk-dialog" role="dialog" aria-modal="true" aria-label="Command menu">
        <Command label="Command menu" loop>
          <div className="cmdk-top">
            <Search size={20} />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search projects, posts, actions…"
              aria-label="Search"
            />
            <span className="esc">ESC</span>
          </div>
          <Command.List>
            <Command.Empty>Nothing found. Try “resnet” or “email”.</Command.Empty>

            <Command.Group heading="Ask my CV">
              <Command.Item
                value={`ask ${query}`}
                keywords={['ask', 'question', 'cv', 'ai']}
                onSelect={() => go('/#ask')}
              >
                <Chat />
                <span className="grow">{query ? `Ask: “${query}”` : 'Ask my CV a question'}</span>
                <span className="hint">soon</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Go to">
              <Command.Item onSelect={() => go('/')}><Arrow /><span className="grow">Home</span></Command.Item>
              <Command.Item onSelect={() => go('/#projects')}><Arrow /><span className="grow">Projects</span></Command.Item>
              <Command.Item onSelect={() => go('/journal')}><Arrow /><span className="grow">Journal</span></Command.Item>
              <Command.Item onSelect={() => go('/#cv')}><Arrow /><span className="grow">CV</span></Command.Item>
            </Command.Group>

            <Command.Group heading="Projects">
              {projects.map((p) => (
                <Command.Item key={p.slug} value={`project ${p.title}`} onSelect={() => go(`/projects/${p.slug}`)}>
                  <Folder />
                  <span className="grow">{p.title}</span>
                  {p.hint && <span className="hint">{p.hint}</span>}
                </Command.Item>
              ))}
            </Command.Group>

            {posts.length > 0 && (
              <Command.Group heading="Journal">
                {posts.map((p) => (
                  <Command.Item key={p.slug} value={`post ${p.title}`} onSelect={() => go(`/journal/${p.slug}`)}>
                    <Doc />
                    <span className="grow">{p.title}</span>
                    {p.hint && <span className="hint">{p.hint}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions">
              <Command.Item keywords={['mail', 'contact']} onSelect={() => run(() => {
                copyText(email, 'Email copied');
                droneCelebrate();
              })}>
                <Copy />
                <span className="grow">Copy email</span>
                <span className="hint">{email}</span>
              </Command.Item>
              {cvFile && (
                <Command.Item keywords={['resume', 'pdf']} onSelect={() => ext(cvFile)}>
                  <Download />
                  <span className="grow">Download CV (PDF)</span>
                </Command.Item>
              )}
              {github && (
                <Command.Item keywords={['code', 'repo']} onSelect={() => ext(github)}>
                  <External />
                  <span className="grow">Open GitHub</span>
                </Command.Item>
              )}
              {linkedin && (
                <Command.Item onSelect={() => ext(linkedin)}>
                  <External />
                  <span className="grow">Open LinkedIn</span>
                </Command.Item>
              )}
              <Command.Item
                keywords={['dark', 'light', 'mode', 'theme']}
                onSelect={() => run(() => showToast(`${toggleTheme() === 'dark' ? 'Dark' : 'Light'} theme`))}
              >
                <Sun />
                <span className="grow">Switch theme</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="cmdk-foot">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </Command>
      </div>
    </>
  );
}
