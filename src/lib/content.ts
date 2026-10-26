import 'server-only';
import { createReader } from '@keystatic/core/reader';
import Markdoc, { type Node } from '@markdoc/markdoc';
import React from 'react';
import keystaticConfig from '../../keystatic.config';

export const reader = createReader(process.cwd(), keystaticConfig);

export async function getProfile() {
  const p = await reader.singletons.profile.readOrThrow();
  return p;
}

export async function getCv() {
  return reader.singletons.cv.readOrThrow();
}

export async function getProjects() {
  const all = await reader.collections.projects.all();
  return all
    .filter((p) => !p.entry.hidden)
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      order: entry.order ?? 99,
      featured: entry.featured,
      year: entry.year,
      context: entry.context,
      status: entry.status,
      summary: entry.summary,
      stack: [...entry.stack],
      repoUrl: entry.repoUrl,
      liveUrl: entry.liveUrl,
      cover: entry.cover,
      video: entry.video,
    }))
    .sort((a, b) => a.order - b.order);
}
export type Project = Awaited<ReturnType<typeof getProjects>>[number];

export async function getPosts() {
  const all = await reader.collections.posts.all();
  return all
    .filter((p) => !p.entry.draft)
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      date: entry.date,
      kind: entry.kind,
      summary: entry.summary,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
export type Post = Awaited<ReturnType<typeof getPosts>>[number];

// Keystatic bundles its own copy of Markdoc, so the node type is taken loosely here.
export async function renderBody(content: () => Promise<{ node: unknown }>) {
  const { node } = await content();
  return Markdoc.renderers.react(Markdoc.transform(node as Node), React);
}

export function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
