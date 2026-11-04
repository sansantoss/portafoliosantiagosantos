import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCv, getPosts, getProfile, getProjects, formatDate } from '@/lib/content';
import { ProjectList } from '@/components/project-list';
import { ScrollDrone } from '@/components/scroll-drone';
import { StackKeyboard } from '@/components/stack-keyboard';
import { SectionProgress } from '@/components/section-progress';
import { PueblaClock } from '@/components/clock';
import { hasLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const [profile, cv, projects, posts] = await Promise.all([getProfile(lang), getCv(lang), getProjects(lang), getPosts(lang)]);
  const years = projects.map((p) => Number(p.year)).filter(Boolean);

  return (
    <>
      <SectionProgress
        label={t.progress.label}
        items={[
          { id: 'intro', label: t.progress.hero },
          { id: 'projects', label: t.progress.projects },
          { id: 'stack', label: t.progress.stack },
          { id: 'ask', label: t.progress.ask },
          { id: 'journal', label: t.progress.journal },
        ]}
      />

      <section id="intro" className="wrap hero">
        <div className="idcard">
          <span className="idcard-avatar" aria-hidden="true">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="" />
            ) : (
              profile.monogram
            )}
          </span>
          <span className="idcard-text">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </span>
          <span className="idcard-meta">
            <span className="idcard-status">
              <span className="dot" aria-hidden="true" style={profile.openToWork ? undefined : { background: 'var(--muted)' }} />
              {profile.openToWork ? t.card.available : t.card.busy}
            </span>
            <span className="idcard-time">{profile.location} · <PueblaClock lang={lang} /></span>
          </span>
        </div>
        <h1>
          {profile.headlineStart} <em data-glow>{profile.headlineEmphasis}</em> {profile.headlineEnd}
        </h1>
        <p>{profile.intro}</p>
        <div className="hero-actions">
          <Link href="#projects" className="btn btn-solid">{t.hero.seeProjects}</Link>
          {profile.cvFile && <a href={profile.cvFile} className="btn">{t.hero.downloadCv}</a>}
        </div>
        <div className="drone-dock hero-dock" data-dock="start" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="drone-poster" src="/models/eye-drone.webp" alt="" />
        </div>
      </section>

      <div className="wrap">
        <dl className="titleblock" style={{ margin: 0, marginBottom: 'clamp(72px, 10vw, 112px)' }}>
          <div><dt className="label">{t.facts.basedIn}</dt><dd className="val" style={{ margin: 0 }}>{profile.location}</dd></div>
          <div><dt className="label">{t.facts.focus}</dt><dd className="val" style={{ margin: 0 }}>{profile.focus}</dd></div>
          <div><dt className="label">{t.facts.education}</dt><dd className="val" style={{ margin: 0 }}>{profile.education}</dd></div>
          <div>
            <dt className="label">{t.facts.status}</dt>
            <dd className="val" style={{ margin: 0 }}>
              {profile.openToWork ? (<><span className="dot" aria-hidden="true" />{t.facts.open}</>) : t.facts.closed}
            </dd>
          </div>
        </dl>
      </div>

      <section id="projects" className="wrap section" style={{ scrollMarginTop: 90 }}>
        <div className="section-head">
          <h2>{t.projects.title}</h2>
          {years.length > 0 && <span className="label">{Math.min(...years)} — {Math.max(...years)}</span>}
        </div>

        <ProjectList
          lang={lang}
          labels={{ categories: t.categories, featured: t.projects.featured, caseStudy: t.projects.caseStudy }}
          rows={projects.map((p) => ({
            slug: p.slug, title: p.title, summary: p.summary, stack: p.stack, year: p.year, context: p.context,
            status: p.status, category: p.category, featured: p.featured, cover: p.cover, video: p.video,
          }))}
        />
      </section>

      <section id="stack" className="wrap section" style={{ scrollMarginTop: 90 }}>
        <div className="section-head"><h2>{t.stack.title}</h2></div>
        <StackKeyboard skills={cv.skills} labels={t.stack} />
      </section>

      <section id="ask" className="wrap section" style={{ scrollMarginTop: 90 }}>
        <div className="ask">
          <div className="ask-intro">
            <span className="label">{t.ask.label}</span>
            <h2 className="h2">{t.ask.titleStart} <em className="em">{t.ask.titleEm}</em></h2>
            <p>{t.ask.body}</p>
          </div>
          <form className="ask-box" aria-describedby="ask-status">
            <label htmlFor="ask-q" className="label">{t.ask.question}</label>
            <div className="ask-field">
              <input id="ask-q" placeholder={t.ask.placeholder} disabled />
              <button type="submit" disabled>{t.ask.button} →</button>
            </div>
            <span id="ask-status" className="badge label">
              <span className="dot" style={{ background: 'var(--accent)' }} aria-hidden="true" />
              {t.ask.status}
            </span>
          </form>
          <div className="drone-dock ask-dock" data-dock="end" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="drone-poster" src="/models/eye-drone.webp" alt="" />
          </div>
        </div>
      </section>

      <section className="wrap section split">
        <div id="journal" className="journal" style={{ scrollMarginTop: 90 }}>
          <div className="section-head"><h2>{t.journal.title}</h2></div>
          {posts.length ? (
            <div className="entries">
              {posts.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/${lang}/journal/${p.slug}`} className="entry reveal" hrefLang={p.shownIn}>
                  <span className="label">
                    {formatDate(p.date, lang)} — {t.journal.kinds[p.kind] ?? p.kind}
                    {p.shownIn !== lang && <span className="lang-chip">{p.shownIn.toUpperCase()}</span>}
                  </span>
                  <span className="entry-title" lang={p.shownIn}>{p.title}</span>
                  {p.summary && <span className="entry-sum" lang={p.shownIn}>{p.summary}</span>}
                </Link>
              ))}
              <Link href={`/${lang}/journal`} className="link-arrow">{t.journal.all} →</Link>
            </div>
          ) : (
            <p className="empty">{t.journal.empty}</p>
          )}
        </div>

        <div id="cv" className="cvcol" style={{ scrollMarginTop: 90 }}>
          <div className="section-head"><h2>{t.cv.title}</h2></div>
          <div className="timeline">
            {cv.entries.map((e, i) => (
              <div className="trow" key={i}>
                <span className="label">{e.period}</span>
                <span><strong>{e.title}</strong><span className="sub">{e.place}</span></span>
              </div>
            ))}
            {cv.languages.length > 0 && (
              <div className="trow">
                <span className="label">{t.cv.lang}</span>
                <span className="sub">{cv.languages.join(' · ')}</span>
              </div>
            )}
          </div>
          {profile.cvFile && <a href={profile.cvFile} className="link-arrow">{t.cv.download} ↗</a>}
        </div>
      </section>

      <ScrollDrone />
    </>
  );
}
