import Link from 'next/link';
import { getCv, getPosts, getProfile, getProjects, formatDate } from '@/lib/content';
import { ProjectList } from '@/components/project-list';
import { ScrollDrone } from '@/components/scroll-drone';

export default async function Home() {
  const [profile, cv, projects, posts] = await Promise.all([getProfile(), getCv(), getProjects(), getPosts()]);
  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => p !== featured);
  const years = projects.map((p) => Number(p.year)).filter(Boolean);

  return (
    <>
      <section className="wrap hero">
        <h1>
          {profile.headlineStart} <em>{profile.headlineEmphasis}</em> {profile.headlineEnd}
        </h1>
        <p>{profile.intro}</p>
        <div className="hero-actions">
          <Link href="#projects" className="btn btn-solid">See projects</Link>
          {profile.cvFile && <a href={profile.cvFile} className="btn">Download CV</a>}
        </div>
        <div className="drone-dock hero-dock" data-dock="start" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="drone-poster" src="/models/eye-drone.webp" alt="" />
        </div>
      </section>

      <div className="wrap">
        <dl className="titleblock" style={{ margin: 0, marginBottom: 'clamp(72px, 10vw, 112px)' }}>
          <div><dt className="label">Based in</dt><dd className="val" style={{ margin: 0 }}>{profile.location}</dd></div>
          <div><dt className="label">Focus</dt><dd className="val" style={{ margin: 0 }}>{profile.focus}</dd></div>
          <div><dt className="label">Education</dt><dd className="val" style={{ margin: 0 }}>{profile.education}</dd></div>
          <div>
            <dt className="label">Status</dt>
            <dd className="val" style={{ margin: 0 }}>
              {profile.openToWork ? (<><span className="dot" aria-hidden="true" />Open to opportunities</>) : 'Not looking right now'}
            </dd>
          </div>
        </dl>
      </div>

      <section id="projects" className="wrap section" style={{ scrollMarginTop: 90 }}>
        <div className="section-head">
          <h2>Projects</h2>
          {years.length > 0 && <span className="label">{Math.min(...years)} — {Math.max(...years)}</span>}
        </div>

        {featured && (
          <Link href={`/projects/${featured.slug}`} className="featured reveal">
            <span className="featured-main">
              <span className="label">01 — Featured{featured.status ? ` · ${featured.status}` : ''}</span>
              <span className="featured-title">{featured.title}</span>
              <span className="featured-summary">{featured.summary}</span>
            </span>
            <span className="featured-side">
              <span>{featured.stack.join(' · ')}</span>
              <span style={{ color: 'var(--invert-ink)' }}>Read the case study →</span>
            </span>
          </Link>
        )}

        <ProjectList
          start={featured ? 2 : 1}
          rows={rest.map((p) => ({
            slug: p.slug, title: p.title, summary: p.summary, stack: p.stack,
            year: p.year, context: p.context, cover: p.cover,
          }))}
        />
      </section>

      <section id="ask" className="wrap section" style={{ scrollMarginTop: 90 }}>
        <div className="ask">
          <div className="ask-intro">
            <span className="label">Ask my CV</span>
            <h2 className="h2">Ask anything <em className="em">about my work.</em></h2>
            <p>
              I&apos;m building a small retrieval system over my CV, projects and journal. Every answer will cite
              where it came from, and if something isn&apos;t in my documents it will say so instead of guessing.
            </p>
          </div>
          <form className="ask-box" aria-describedby="ask-status">
            <label htmlFor="ask-q" className="label">Your question</label>
            <div className="ask-field">
              <input id="ask-q" placeholder="What AI work has he done?" disabled />
              <button type="submit" disabled>Ask →</button>
            </div>
            <span id="ask-status" className="badge label">
              <span className="dot" style={{ background: 'var(--accent)' }} aria-hidden="true" />
              In development — follow the build in the journal
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
          <div className="section-head"><h2>Journal</h2></div>
          {posts.length ? (
            <div className="entries">
              {posts.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/journal/${p.slug}`} className="entry reveal">
                  <span className="label">{formatDate(p.date)} — {p.kind}</span>
                  <span className="entry-title">{p.title}</span>
                  {p.summary && <span className="entry-sum">{p.summary}</span>}
                </Link>
              ))}
              <Link href="/journal" className="link-arrow">All entries →</Link>
            </div>
          ) : (
            <p className="empty">First entries are on the way: write-ups of how each project was built.</p>
          )}
        </div>

        <div id="cv" className="cvcol" style={{ scrollMarginTop: 90 }}>
          <div className="section-head"><h2>CV</h2></div>
          <div className="timeline">
            {cv.entries.map((e, i) => (
              <div className="trow" key={i}>
                <span className="label">{e.period}</span>
                <span><strong>{e.title}</strong><span className="sub">{e.place}</span></span>
              </div>
            ))}
            {cv.languages.length > 0 && (
              <div className="trow">
                <span className="label">Lang</span>
                <span className="sub">{cv.languages.join(' · ')}</span>
              </div>
            )}
          </div>
          <div className="tags" style={{ marginBottom: 24 }}>
            {cv.skills.map((s) => <span className="tag" key={s}>{s}</span>)}
          </div>
          {profile.cvFile && <a href={profile.cvFile} className="link-arrow">Download full CV (PDF) ↗</a>}
        </div>
      </section>

      <ScrollDrone />
    </>
  );
}
