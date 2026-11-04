import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChat, getCv, getGraph, getPosts, getProfile, getProjects, formatDate } from '@/lib/content';
import { HeroHeadline } from '@/components/hero-headline';
import { KnowledgeGraph } from '@/components/knowledge-graph';
import { HobbyChat } from '@/components/hobby-chat';
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
  const [profile, cv, projects, posts, graph, chat] = await Promise.all([
    getProfile(lang), getCv(lang), getProjects(lang), getPosts(lang), getGraph(lang), getChat(lang),
  ]);
  const years = projects.map((p) => Number(p.year)).filter(Boolean);
  // Structured data so search engines know who this site is about.
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: profile.shortName,
    url: `https://sansantos.com/${lang}`,
    image: 'https://sansantos.com/images/profile/portrait.jpg',
    jobTitle: profile.role,
    email: `mailto:${profile.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Puebla', addressCountry: 'MX' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Tecnológico de Monterrey' },
    knowsLanguage: ['es', 'en', 'de', 'fr'],
    knowsAbout: cv.skills.map((k) => k.name),
    sameAs: [profile.github, profile.linkedin].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, '\\u003c') }} />
      <SectionProgress
        label={t.progress.label}
        items={[
          { id: 'intro', label: t.progress.hero },
          { id: 'projects', label: t.progress.projects },
          { id: 'stack', label: t.progress.stack },
          { id: 'graph', label: t.progress.graph },
          { id: 'ask', label: t.progress.ask },
          ...(chat.length ? [{ id: 'off', label: t.progress.more }] : []),
          { id: 'journal', label: t.progress.journal },
        ]}
      />

      <section id="intro" className="wrap hero">
        <div className="idcard">
          <span className="idcard-avatar" aria-hidden="true">
            {profile.avatar ? (
              <Image src={profile.avatar} alt="" width={48} height={48} sizes="48px" priority />
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
        <HeroHeadline start={profile.headlineStart} em={profile.headlineEmphasis} end={profile.headlineEnd} labels={t.tokens} />
        <p>{profile.intro}</p>
        <div className="hero-actions">
          <Link href="#projects" className="btn btn-solid">{t.hero.seeProjects}</Link>
          {profile.cvFile && <a href={profile.cvFile} className="btn">{t.hero.downloadCv}</a>}
        </div>
        <div className="drone-dock hero-dock" data-dock="start" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="drone-poster" src="/models/eye-drone.webp" alt="" loading="lazy" />
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

      <section id="graph" className="wrap section" style={{ scrollMarginTop: 90 }}>
        <div className="section-head">
          <h2>{t.graph.title}</h2>
          <span className="label">{graph.nodes.length} · {graph.links.length}</span>
        </div>
        <p className="section-lede">{t.graph.lede}</p>
        <KnowledgeGraph nodes={graph.nodes} links={graph.links} width={graph.width} height={graph.height} labels={t.graph} />
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
            <img className="drone-poster" src="/models/eye-drone.webp" alt="" loading="lazy" />
          </div>
        </div>
      </section>

      {chat.length > 0 && (
        <section id="off" className="wrap section off" style={{ scrollMarginTop: 90 }}>
          <div className="off-intro">
            <h2 className="h2">{t.chat.title}</h2>
            <p>{t.chat.lede}</p>
          </div>
          <HobbyChat messages={chat} droneName={t.chat.drone} meName={t.chat.me} />
        </section>
      )}

      <section className="wrap section split">
        <div id="journal" className="journal" style={{ scrollMarginTop: 90 }}>
          <div className="section-head"><h2>{t.journal.title}</h2></div>
          {posts.length ? (
            <div className="entries">
              {posts.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/${lang}/journal/${p.slug}`} className="entry reveal" hrefLang={p.shownIn}>
                  <span className="label">
                    {formatDate(p.date, lang)} — {t.journal.kinds[p.kind] ?? p.kind} · {p.minutes} {t.journal.min}
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
