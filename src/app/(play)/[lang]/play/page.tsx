import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile, getProjects } from '@/lib/content';
import { hasLocale, otherLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { SbOs } from '@/play/sb-os';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: { canonical: `/${lang}/play`, languages: { en: '/en/play', es: '/es/play' } },
    robots: { index: true, follow: true },
  };
}

export default async function Play({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const [projects, profile] = await Promise.all([getProjects(lang), getProfile(lang)]);
  return (
    <SbOs
      home={`/${lang}`}
      labels={{ ...t.play }}
      kinds={t.categories}
      otherLang={`/${otherLocale(lang)}/play`}
      achievements={Object.fromEntries(Object.entries(t.achievements.items).map(([k, v]) => [k, v.name]))}
      profile={{
        name: profile.name, role: profile.role, location: profile.location, email: profile.email,
        github: (profile.github ?? '').replace(/^https?:\/\//, ''), linkedin: (profile.linkedin ?? '').replace(/^https?:\/\//, ''),
      }}
      projects={projects.map((p) => ({
        slug: p.slug, title: p.title, summary: p.summary, year: p.year ?? '', category: p.category, stack: p.stack,
        featured: p.featured, planet: p.planet, moons: p.moons, rings: p.rings, href: `/${lang}/projects/${p.slug}`,
      }))}
    />
  );
}
