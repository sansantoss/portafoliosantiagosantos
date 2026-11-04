import 'server-only';
import { createReader } from '@keystatic/core/reader';
import Markdoc, { type Node } from '@markdoc/markdoc';
import React from 'react';
import keystaticConfig from '../../keystatic.config';
import type { Locale } from '@/i18n/config';

export const reader = createReader(process.cwd(), keystaticConfig);

/** Spanish value when we're on /es and it exists; English otherwise. */
const pick = (lang: Locale, en: string | null | undefined, es: string | null | undefined) =>
  (lang === 'es' && es?.trim() ? es : en) ?? '';

export async function getProfile(lang: Locale) {
  const p = await reader.singletons.profile.readOrThrow();
  return {
    name: p.name,
    shortName: p.shortName,
    monogram: p.monogram,
    avatar: p.avatar,
    role: pick(lang, p.role, p.roleEs),
    headlineStart: pick(lang, p.headlineStart, p.headlineStartEs),
    headlineEmphasis: pick(lang, p.headlineEmphasis, p.headlineEmphasisEs),
    headlineEnd: pick(lang, p.headlineEnd, p.headlineEndEs),
    intro: pick(lang, p.intro, p.introEs),
    location: pick(lang, p.location, p.locationEs),
    focus: pick(lang, p.focus, p.focusEs),
    education: pick(lang, p.education, p.educationEs),
    openToWork: p.openToWork,
    email: p.email,
    github: p.github,
    linkedin: p.linkedin,
    cvFile: (lang === 'es' && p.cvFileEs) || p.cvFile,
    closingLine: pick(lang, p.closingLine, p.closingLineEs),
    closingEmphasis: pick(lang, p.closingEmphasis, p.closingEmphasisEs),
    quote: pick(lang, p.quote, p.quoteEs),
  };
}

export async function getCv(lang: Locale) {
  const c = await reader.singletons.cv.readOrThrow();
  return {
    entries: c.entries.map((e) => ({ period: e.period, title: pick(lang, e.title, e.titleEs), place: pick(lang, e.place, e.placeEs) })),
    skills: c.skills.map((k) => ({ name: k.name, category: k.category })),
    languages: c.languages.map((l) => pick(lang, l.en, l.es)),
  };
}

type RawProject = NonNullable<Awaited<ReturnType<typeof reader.collections.projects.read>>>;

function localizeProject(lang: Locale, slug: string, e: RawProject) {
  return {
    slug,
    title: pick(lang, e.title, e.titleEs),
    order: e.order ?? 99,
    featured: e.featured,
    category: e.category,
    hidden: e.hidden,
    year: e.year,
    context: pick(lang, e.context, e.contextEs),
    status: pick(lang, e.status, e.statusEs),
    summary: pick(lang, e.summary, e.summaryEs),
    stack: [...e.stack],
    repoUrl: e.repoUrl,
    liveUrl: e.liveUrl,
    demoUrl: e.demoUrl,
    cover: e.cover,
    video: e.video,
    gallery: e.gallery
      .filter((g) => g.image)
      .map((g) => ({ image: g.image as string, caption: pick(lang, g.caption, g.captionEs) })),
  };
}

export async function getProjects(lang: Locale) {
  const all = await reader.collections.projects.all();
  return all
    .filter((p) => !p.entry.hidden)
    .map(({ slug, entry }) => localizeProject(lang, slug, entry))
    .sort((a, b) => a.order - b.order);
}
export type Project = Awaited<ReturnType<typeof getProjects>>[number];

export async function getProject(lang: Locale, slug: string) {
  const e = await reader.collections.projects.read(slug);
  if (!e || e.hidden) return null;
  // Spanish write-up if it has text; otherwise the English one.
  const esBody = lang === 'es' ? await e.contentEs() : null;
  const hasEs = !!esBody && ((esBody.node as Node).children?.length ?? 0) > 0;
  return { ...localizeProject(lang, slug, e), body: hasEs ? e.contentEs : e.content };
}

type RawPost = NonNullable<Awaited<ReturnType<typeof reader.collections.posts.read>>>;

/** A post is written in one language and may carry a translation into the other. */
function localizePost(lang: Locale, slug: string, e: RawPost) {
  const original = (e.language as Locale) ?? 'en';
  const translated = lang !== original && !!e.translationTitle?.trim();
  return {
    slug,
    date: e.date ?? '',
    kind: e.kind,
    tags: [...(e.tags ?? [])],
    original,
    shownIn: (translated || lang === original ? lang : original) as Locale,
    title: translated ? e.translationTitle : e.title,
    summary: translated ? e.translationSummary || e.summary : e.summary,
    body: translated ? e.translationContent : e.content,
  };
}

export async function getPosts(lang: Locale) {
  const all = await reader.collections.posts.all();
  const out = await Promise.all(
    all
      .filter((p) => !p.entry.draft)
      .map(async ({ slug, entry }) => {
        const { body, ...rest } = localizePost(lang, slug, entry);
        return { ...rest, minutes: await readingMinutes(body) };
      })
  );
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Rough reading time: words in the post body at ~220 words per minute. */
export async function readingMinutes(content: unknown) {
  try {
    const resolved = typeof content === 'function' ? await (content as () => Promise<{ node: Node }>)() : (content as { node: Node });
    let words = 0;
    for (const n of resolved.node.walk()) {
      if (n.type === 'text' && typeof n.attributes.content === 'string') words += n.attributes.content.split(/\s+/).filter(Boolean).length;
    }
    return Math.max(1, Math.round(words / 220));
  } catch {
    return 1;
  }
}
export type Post = Awaited<ReturnType<typeof getPosts>>[number];

export async function getPost(lang: Locale, slug: string) {
  const e = await reader.collections.posts.read(slug);
  if (!e || e.draft) return null;
  return localizePost(lang, slug, e);
}

// Keystatic bundles its own copy of Markdoc, so the node type is taken loosely here.
export async function renderBody(content: { node: unknown } | (() => Promise<{ node: unknown }>)) {
  const { node } = typeof content === 'function' ? await content() : content;
  return Markdoc.renderers.react(Markdoc.transform(node as Node), React);
}

export function formatDate(iso: string, lang: Locale) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function getChat(lang: Locale) {
  const c = await reader.singletons.chat.read();
  return (c?.messages ?? [])
    .map((m) => ({ from: m.from as 'drone' | 'me', text: pick(lang, m.text, m.textEs) }))
    .filter((m) => m.text);
}

export async function getSetup(lang: Locale) {
  const s = await reader.singletons.setup.read();
  return (s?.groups ?? [])
    .map((g) => ({
      title: pick(lang, g.title, g.titleEs),
      items: g.items.map((i) => ({ name: i.name, note: pick(lang, i.note, i.noteEs), url: i.url })),
    }))
    .filter((g) => g.items.length);
}

/** Projects ↔ technologies ↔ posts, from content that already exists. */
export async function getGraph(lang: Locale) {
  const [projects, posts, cv] = await Promise.all([getProjects(lang), getPosts(lang), getCv(lang)]);
  const catOf = new Map(cv.skills.map((k) => [k.name.toLowerCase(), k.category]));
  const nodes: { id: string; label: string; kind: 'project' | 'tech' | 'post'; href?: string; group?: string }[] = [];
  const links: { source: string; target: string }[] = [];
  const tech = new Set<string>();
  for (const p of projects) {
    nodes.push({ id: `p:${p.slug}`, label: p.title, kind: 'project', href: `/${lang}/projects/${p.slug}` });
    for (const t of p.stack) {
      const id = `t:${t.toLowerCase()}`;
      if (!tech.has(id)) { tech.add(id); nodes.push({ id, label: t, kind: 'tech', group: catOf.get(t.toLowerCase()) ?? 'other' }); }
      links.push({ source: `p:${p.slug}`, target: id });
    }
  }
  for (const post of posts) {
    const id = `b:${post.slug}`;
    const related = post.tags.map((t) => `t:${t.toLowerCase()}`).filter((t) => tech.has(t));
    if (!related.length) continue;
    nodes.push({ id, label: post.title ?? post.slug, kind: 'post', href: `/${lang}/journal/${post.slug}` });
    related.forEach((t) => links.push({ source: id, target: t }));
  }
  return { nodes, links };
}
