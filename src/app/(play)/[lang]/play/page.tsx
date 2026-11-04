import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjects } from '@/lib/content';
import { hasLocale } from '@/i18n/config';
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
  const projects = await getProjects(lang);
  return (
    <SbOs
      home={`/${lang}`}
      labels={{ ...t.play }}
      kinds={t.categories}
      projects={projects.map((p) => ({
        slug: p.slug, title: p.title, summary: p.summary, year: p.year ?? '', category: p.category, stack: p.stack,
        featured: p.featured, planet: p.planet, moons: p.moons, rings: p.rings, href: `/${lang}/projects/${p.slug}`,
      }))}
    />
  );
}
