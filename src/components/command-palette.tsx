'use client';
import { Command } from 'cmdk';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chat, Copy, Doc, Download, External, Folder, Globe, Search, Sun, Arrow } from './icons';
import { copyText, showToast } from './toast';
import { toggleTheme } from './theme';
import { droneCelebrate, droneLook } from './drone-events';
import { achieve } from './achievements';
import { beforeLocaleSwitch, otherLocale, switchLocalePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

type Item = { slug: string; title: string; hint?: string };
type Props = {
  lang: Locale;
  t: Dictionary['palette'];
  emailCopied: string;
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

export function PaletteButton({ label, short }: { label: string; short: string }) {
  return (
    <button type="button" className="kbd-btn" onClick={openPalette} aria-label={`${label} (⌘K)`}>
      <span className="kbd-long">⌘K</span>
      <span className="kbd-short" aria-hidden="true">{short}</span>
    </button>
  );
}

export function CommandPalette({ lang, t, emailCopied, projects, posts, email, github, linkedin, cvFile }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement;
    setQuery('');
    setOpen(true);
    achieve('palette');
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
    window.dispatchEvent(new Event(open ? 'palette:open' : 'palette:close'));
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
      <div className="cmdk-dialog" data-lenis-prevent role="dialog" aria-modal="true" aria-label={t.goTo}>
        <Command label={t.goTo} loop>
          <div className="cmdk-top">
            <Search size={20} />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
            />
            <span className="esc">ESC</span>
          </div>
          <Command.List>
            <Command.Empty>{t.empty}</Command.Empty>

            <Command.Group heading={t.ask}>
              <Command.Item
                value={`ask ${query}`}
                keywords={['ask', 'question', 'cv', 'ai', 'preguntar', 'pregunta']}
                onSelect={() => go(`/${lang}#ask`)}
              >
                <Chat />
                <span className="grow">{query ? `${t.askPrefix}: “${query}”` : t.askAction}</span>
                <span className="hint">{t.soon}</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading={t.goTo}>
              <Command.Item onSelect={() => go(`/${lang}`)}><Arrow /><span className="grow">{t.home}</span></Command.Item>
              <Command.Item onSelect={() => go(`/${lang}#projects`)}><Arrow /><span className="grow">{t.projects}</span></Command.Item>
              <Command.Item onSelect={() => go(`/${lang}/journal`)}><Arrow /><span className="grow">{t.journal}</span></Command.Item>
              <Command.Item onSelect={() => go(`/${lang}#cv`)}><Arrow /><span className="grow">{t.cv}</span></Command.Item>
            </Command.Group>

            <Command.Group heading={t.projects}>
              {projects.map((p) => (
                <Command.Item key={p.slug} value={`project ${p.title}`} onSelect={() => go(`/${lang}/projects/${p.slug}`)}>
                  <Folder />
                  <span className="grow">{p.title}</span>
                  {p.hint && <span className="hint">{p.hint}</span>}
                </Command.Item>
              ))}
            </Command.Group>

            {posts.length > 0 && (
              <Command.Group heading={t.journal}>
                {posts.map((p) => (
                  <Command.Item key={p.slug} value={`post ${p.title}`} onSelect={() => go(`/${lang}/journal/${p.slug}`)}>
                    <Doc />
                    <span className="grow">{p.title}</span>
                    {p.hint && <span className="hint">{p.hint}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading={t.actions}>
              <Command.Item keywords={['mail', 'contact']} onSelect={() => run(() => {
                copyText(email, emailCopied);
                achieve('contact');
                droneCelebrate();
              })}>
                <Copy />
                <span className="grow">{t.copyEmail}</span>
                <span className="hint">{email}</span>
              </Command.Item>
              {cvFile && (
                <Command.Item keywords={['resume', 'pdf']} onSelect={() => ext(cvFile)}>
                  <Download />
                  <span className="grow">{t.downloadCv}</span>
                </Command.Item>
              )}
              {github && (
                <Command.Item keywords={['code', 'repo']} onSelect={() => ext(github)}>
                  <External />
                  <span className="grow">{t.github}</span>
                </Command.Item>
              )}
              {linkedin && (
                <Command.Item onSelect={() => ext(linkedin)}>
                  <External />
                  <span className="grow">{t.linkedin}</span>
                </Command.Item>
              )}
              <Command.Item
                keywords={['dark', 'light', 'mode', 'theme']}
                onSelect={() => run(() => {
                  const next = toggleTheme();
                  showToast(next === 'dark' ? t.dark : t.light);
                })}
              >
                <Sun />
                <span className="grow">{t.theme}</span>
              </Command.Item>
              <Command.Item
                keywords={['language', 'idioma', 'english', 'español', 'spanish', 'ingles']}
                onSelect={() => run(() => {
                  const to = otherLocale(lang);
                  beforeLocaleSwitch(to);
                  window.location.assign(switchLocalePath(pathname, to));
                })}
              >
                <Globe />
                <span className="grow">{t.switchLang}</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="cmdk-foot">
            <span>↑↓ {t.navigate}</span>
            <span>↵ {t.open}</span>
            <span>esc {t.close}</span>
          </div>
        </Command>
      </div>
    </>
  );
}
