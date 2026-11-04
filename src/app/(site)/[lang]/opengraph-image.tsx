import { ImageResponse } from 'next/og';
import { getProfile } from '@/lib/content';
import { hasLocale, locales } from '@/i18n/config';
import { C, OG_SIZE, Volcanoes, ogFonts, portraitDataUrl } from '@/og/card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Santiago Santos Bante';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : 'en';
  const [p, fonts, photo] = await Promise.all([getProfile(lang), ogFonts(), portraitDataUrl()]);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: C.bg, position: 'relative', fontFamily: 'Sans' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 0 150px 72px', width: 780 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 56, height: 56, border: `1.5px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Serif', fontSize: 28, color: C.ink }}>{p.monogram}</div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 18, letterSpacing: 2, color: C.ink2, textTransform: 'uppercase' }}>sansantos.com</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', fontFamily: 'Serif', fontSize: 78, lineHeight: 1, color: C.ink, letterSpacing: -1 }}>{p.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', fontFamily: 'Serif', fontSize: 40, lineHeight: 1.15, color: C.ink2 }}>
              <span>{p.headlineStart}&nbsp;</span>
              <span style={{ fontStyle: 'italic', color: C.accent }}>{p.headlineEmphasis}</span>
              <span>&nbsp;{p.headlineEnd}</span>
            </div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 20, color: C.ink2 }}>{p.role} · {p.location}</div>
          </div>
        </div>
        <img src={photo} width={420} height={630} alt="" style={{ position: 'absolute', right: 0, top: 0, objectFit: 'cover' }} />
        <Volcanoes />
      </div>
    ),
    { ...size, fonts }
  );
}
