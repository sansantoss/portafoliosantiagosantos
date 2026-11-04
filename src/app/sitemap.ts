import type { MetadataRoute } from 'next';
import { getPosts, getProjects, getSetup } from '@/lib/content';
import { locales } from '@/i18n/config';

const BASE = 'https://sansantos.com';

// Every page in both languages, each pointing at its translation.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, setup] = await Promise.all([getProjects('en'), getPosts('en'), getSetup('en')]);
  const paths = [
    { path: '', priority: 1 },
    { path: '/journal', priority: 0.6 },
    ...(setup.length ? [{ path: '/setup', priority: 0.3 }] : []),
    ...projects.map((p) => ({ path: `/projects/${p.slug}`, priority: 0.8 })),
    ...posts.map((p) => ({ path: `/journal/${p.slug}`, priority: 0.6, date: p.date })),
  ];
  return paths.flatMap(({ path, priority, ...rest }) =>
    locales.map((lang) => ({
      url: `${BASE}/${lang}${path}`,
      lastModified: 'date' in rest && rest.date ? new Date(rest.date as string) : undefined,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${BASE}/${l}${path}`])) },
    }))
  );
}
