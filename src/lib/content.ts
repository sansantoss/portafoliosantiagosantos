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
  };
}

export async function getCv(lang: Locale) {
  const c = await reader.singletons.cv.readOrThrow();
  return {
    entries: c.entries.map((e) => ({ period: e.period, title: pick(lang, e.title, e.titleEs), place: pick(lang, e.place, e.placeEs) })),
    skills: [...c.skills],
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
    original,
    shownIn: (translated || lang === original ? lang : original) as Locale,
    title: translated ? e.translationTitle : e.title,
    summary: translated ? e.translationSummary || e.summary : e.summary,
    body: translated ? e.translationContent : e.content,
  };
}

export async function getPosts(lang: Locale) {
  const all = await reader.collections.posts.all();
  return all
    .filter((p) => !p.entry.draft)
    .map(({ slug, entry }) => {
      const { body: _body, ...rest } = localizePost(lang, slug, entry);
      void _body;
      return rest;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
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
