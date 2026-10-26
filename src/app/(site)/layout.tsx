import type { Metadata } from 'next';
import Link from 'next/link';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { getPosts, getProfile, getProjects, formatDate } from '@/lib/content';
import { CommandPalette, PaletteButton } from '@/components/command-palette';
import { CopyEmail } from '@/components/copy-email';
import { Toaster } from '@/components/toast';
import { themeScript } from '@/components/theme';

// Fonts are self-hosted (no request to Google at build or run time).
const serif = localFont({
  src: [
    { path: '../../fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--f-serif',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  return {
    metadataBase: new URL('https://sansantos.com'),
    title: { default: `${p.name} · Software & AI engineering`, template: `%s · ${p.shortName}` },
    description: p.intro,
    openGraph: { type: 'website', siteName: 'sansantos.com', title: p.name, description: p.intro },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [profile, projects, posts] = await Promise.all([getProfile(), getProjects(), getPosts()]);
  const year = new Date().getFullYear();

  return (
    <html lang="en" className={`${serif.variable} ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand" aria-label={`${profile.name}, home`}>
              <span className="monogram" aria-hidden="true">{profile.monogram}</span>
              <span className="brand-name">{profile.shortName}</span>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/#projects">Projects</Link>
              <Link href="/journal">Journal</Link>
              <Link href="/#cv" className="hide-sm">CV</Link>
              <a href={`mailto:${profile.email}`} className="hide-sm" style={{ color: 'var(--ink)' }}>Contact →</a>
              <PaletteButton />
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
                <CopyEmail email={profile.email} />
              </div>
              <span className="muted">© {year} {profile.name} · Press ⌘K</span>
            </div>
          </div>
        </footer>

        <CommandPalette
          projects={projects.map((p) => ({ slug: p.slug, title: p.title, hint: p.year }))}
          posts={posts.map((p) => ({ slug: p.slug, title: p.title, hint: formatDate(p.date) }))}
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
