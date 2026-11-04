import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { getPosts, getProfile, getProjects, formatDate } from '@/lib/content';
import { CommandPalette, PaletteButton } from '@/components/command-palette';
import { CopyEmail } from '@/components/copy-email';
import { LanguageSwitch } from '@/components/language-switch';
import { Toaster } from '@/components/toast';
import { themeScript } from '@/components/theme';
import { hasLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

// Fonts are self-hosted (no request to Google at build or run time).
const serif = localFont({
  src: [
    { path: '../../../fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../../fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--f-serif',
  display: 'swap',
});

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const p = await getProfile(lang);
  const t = getDictionary(lang);
  return {
    metadataBase: new URL('https://sansantos.com'),
    title: { default: `${p.name} · ${t.meta.role}`, template: `%s · ${p.shortName}` },
    description: p.intro,
    alternates: { canonical: `/${lang}`, languages: { en: '/en', es: '/es', 'x-default': '/en' } },
    openGraph: {
      type: 'website',
      siteName: 'sansantos.com',
      title: p.name,
      description: p.intro,
      locale: lang === 'es' ? 'es_MX' : 'en_US',
    },
  };
}

export default async function SiteLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const [profile, projects, posts] = await Promise.all([getProfile(lang), getProjects(lang), getPosts(lang)]);
  const year = new Date().getFullYear();

  return (
    <html lang={lang} className={`${serif.variable} ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">{themeScript}</Script>
        <a href="#main" className="skip">{t.nav.skip}</a>
        <header className="site-header">
          <div className="wrap">
            <Link href={`/${lang}`} className="brand" aria-label={`${profile.name}, ${t.nav.home}`}>
              <span className="monogram" aria-hidden="true">{profile.monogram}</span>
              <span className="brand-name">{profile.shortName}</span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href={`/${lang}#projects`}>{t.nav.projects}</Link>
              <Link href={`/${lang}/journal`}>{t.nav.journal}</Link>
              <Link href={`/${lang}#cv`} className="hide-sm">{t.nav.cv}</Link>
              <a href={`mailto:${profile.email}`} className="hide-sm" style={{ color: 'var(--ink)' }}>{t.nav.contact} →</a>
              <LanguageSwitch lang={lang} label={t.nav.language} />
              <PaletteButton label={t.nav.menu} />
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="site-footer">
          <div className="wrap">
            <p className="big" style={{ margin: 0 }}>
              {profile.closingLine} <em>{profile.closingEmphasis}</em>
            </p>
            <div className="foot-row">
              <div className="foot-links">
                {profile.github && <a href={profile.github}>GitHub</a>}
                {profile.linkedin && <a href={profile.linkedin}>LinkedIn</a>}
                <CopyEmail email={profile.email} copiedLabel={t.footer.emailCopied} />
              </div>
              <span className="muted">© {year} {profile.name} · {t.footer.press}</span>
            </div>
          </div>
        </footer>

        <CommandPalette
          lang={lang}
          t={t.palette}
          emailCopied={t.footer.emailCopied}
          projects={projects.map((p) => ({ slug: p.slug, title: p.title, hint: p.year }))}
          posts={posts.map((p) => ({ slug: p.slug, title: p.title, hint: formatDate(p.date, lang) }))}
          email={profile.email}
          github={profile.github}
          linkedin={profile.linkedin}
          cvFile={profile.cvFile}
        />
        <Toaster />
      </body>
    </html>
  );
}
