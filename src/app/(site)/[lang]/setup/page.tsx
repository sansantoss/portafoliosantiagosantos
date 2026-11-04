import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSetup } from '@/lib/content';
import { hasLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Setup',
    alternates: { canonical: `/${lang}/setup`, languages: { en: '/en/setup', es: '/es/setup' } },
  };
}

// "Uses" page in the Apple-store spirit: one card per item, grouped. Edited in the editor under Settings → Setup.
export default async function SetupPage({ params }: Params) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang).setup;
  const groups = await getSetup(lang);
  if (!groups.length) notFound();
  return (
    <section className="wrap detail">
      <div className="label" style={{ marginBottom: 18 }}>{t.label}</div>
      <h1>{t.title}</h1>
      <p className="lede">{t.lede}</p>
      {groups.map((g) => (
        <section key={g.title} className="uses-group">
          <h2 className="uses-title">{g.title}</h2>
          <div className="uses-grid">
            {g.items.map((i) => {
              const inner = (
                <>
                  <span className="uses-name">{i.name}</span>
                  {i.note && <span className="uses-note">{i.note}</span>}
                  {i.url && <span className="uses-link" aria-hidden="true">↗</span>}
                </>
              );
              return i.url ? (
                <a key={i.name} href={i.url} className="uses-card" data-spotlight target="_blank" rel="noopener">{inner}</a>
              ) : (
                <div key={i.name} className="uses-card" data-spotlight>{inner}</div>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
