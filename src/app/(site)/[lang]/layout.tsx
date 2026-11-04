import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { getPosts, getProfile, getProjects, formatDate } from '@/lib/content';
import { CommandPalette, PaletteButton } from '@/components/command-palette';
import { CopyEmail } from '@/components/copy-email';
import { LanguageSwitch } from '@/components/language-switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { SkyScene } from '@/components/sky-scene';
import { Toaster } from '@/components/toast';
import { Intro } from '@/components/intro';
import { Interactions } from '@/components/interactions';
import { PueblaClock } from '@/components/clock';
import { Achievements, AchievementsButton } from '@/components/achievements';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
      alternateLocale: lang === 'es' ? 'en_US' : 'es_MX',
    },
    twitter: { card: 'summary_large_image' },
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
      <head>
        {/* Blocking on purpose: applies the saved theme and the intro decision before the first paint. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body>
        <Intro words={t.intro.words} skip={t.intro.skip} />
        <Interactions />
        <a href="#main" className="skip">{t.nav.skip}</a>
        <header className="site-header">
          <div className="wrap">
            <Link href={`/${lang}`} className="brand" aria-label={`${profile.shortName}, ${t.nav.home}`}>
              <span className="monogram" aria-hidden="true">{profile.monogram}</span>
              <span className="brand-name">{profile.shortName}</span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href={`/${lang}#projects`} className="hide-xs">{t.nav.projects}</Link>
              <Link href={`/${lang}/journal`} className="hide-xs">{t.nav.journal}</Link>
              <Link href={`/${lang}#cv`} className="hide-sm">{t.nav.cv}</Link>
              <a href={`mailto:${profile.email}`} className="hide-sm" style={{ color: 'var(--ink)' }}>{t.nav.contact} →</a>
              <LanguageSwitch lang={lang} label={t.nav.language} />
              <ThemeToggle label={t.nav.theme} />
              <PaletteButton label={t.nav.menu} short={t.nav.menuShort} />
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer className="site-footer">
          <div className="wrap">
            <p className="big" style={{ margin: 0 }}>
              {profile.closingLine} <em>{profile.closingEmphasis}</em>
            </p>
            <div className="foot-grid">
              <div>
                <span className="foot-label">{t.foot.links}</span>
                <Link href={`/${lang}#projects`}>{t.nav.projects}</Link>
                <Link href={`/${lang}#stack`}>{t.stack.title}</Link>
                <Link href={`/${lang}/journal`}>{t.nav.journal}</Link>
                <Link href={`/${lang}#cv`}>{t.nav.cv}</Link>
                <Link href={`/${lang}/setup`}>{t.setup.title}</Link>
                <a href={`/${lang}/play`}>SB-OS ↗</a>
                <AchievementsButton label={t.achievements.button} />
              </div>
              <div>
                <span className="foot-label">{t.foot.contact}</span>
                <CopyEmail email={profile.email} copiedLabel={t.footer.emailCopied} />
                {profile.github && <a href={profile.github}>GitHub ↗</a>}
                {profile.linkedin && <a href={profile.linkedin}>LinkedIn ↗</a>}
              </div>
              <div>
                <span className="foot-label">{t.foot.status}</span>
                <span className="foot-status">
                  <span className="dot" aria-hidden="true" style={profile.openToWork ? undefined : { background: 'var(--invert-muted)' }} />
                  {profile.openToWork ? t.card.available : t.card.busy}
                </span>
                <span className="foot-label" style={{ marginTop: 14 }}>{t.foot.time}</span>
                <PueblaClock lang={lang} />
              </div>
            </div>
          </div>
          <SkyScene
            labels={t.sky}
            launchHref={`/${lang}/play#launch`}
            caption={<>{profile.quote ? <>“{profile.quote}”</> : null}<small>{t.sky.place}</small></>}
          >
            <div className="wrap foot-row">
              <span className="muted">© {year} {profile.name} · {t.footer.press}</span>
              <a href="#main" className="muted">{t.foot.top} ↑</a>
            </div>
          </SkyScene>
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
        <Achievements labels={t.achievements} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
