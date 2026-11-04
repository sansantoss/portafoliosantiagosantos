import { ImageResponse } from 'next/og';
import { getProfile, getProject, reader } from '@/lib/content';
import { hasLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { C, OG_SIZE, Volcanoes, ogFonts } from '@/og/card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Project';

export async function generateStaticParams() {
  const slugs = await reader.collections.projects.list();
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = hasLocale(raw) ? raw : 'en';
  const t = getDictionary(lang);
  const [project, p, fonts] = await Promise.all([getProject(lang, slug), getProfile(lang), ogFonts()]);
  const title = project?.title ?? p.name;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: C.bg, position: 'relative', padding: '64px 72px 160px', fontFamily: 'Sans' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Mono', fontSize: 18, letterSpacing: 2, color: C.ink2, textTransform: 'uppercase' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 48, height: 48, border: `1.5px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Serif', fontSize: 24, color: C.ink, letterSpacing: 0 }}>{p.monogram}</div>
            {p.name}
          </div>
          <div style={{ display: 'flex' }}>{[project ? t.categories[project.category] : null, project?.year].filter(Boolean).join(' · ')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', fontFamily: 'Serif', fontSize: title.length > 28 ? 72 : 92, lineHeight: 1, color: C.ink, letterSpacing: -1 }}>{title}</div>
          {project?.summary && <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.35, color: C.ink2, maxWidth: 940 }}>{project.summary}</div>}
          {project && project.stack.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {project.stack.slice(0, 6).map((s) => (
                <div key={s} style={{ display: 'flex', fontFamily: 'Mono', fontSize: 18, color: C.ink, border: `1px solid ${C.line}`, padding: '6px 12px' }}>{s}</div>
              ))}
            </div>
          )}
        </div>
        <Volcanoes />
      </div>
    ),
    { ...size, fonts }
  );
}
