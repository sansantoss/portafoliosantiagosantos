import { config, fields, collection, singleton } from '@keystatic/core';

// Local mode: edit at http://localhost:3000/keystatic and changes are written to the files in /content.
// GitHub mode: set NEXT_PUBLIC_KEYSTATIC_STORAGE=github in Vercel and edit at sansantos.com/keystatic
// (log in with GitHub; each save becomes a commit and Vercel redeploys). See README.
const useGithub = process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github';

export default config({
  storage: useGithub
    ? { kind: 'github', repo: { owner: 'sansantoss', name: 'portafoliosantiagosantos' } }
    : { kind: 'local' },
  ui: {
    brand: { name: 'sansantos.com' },
    navigation: {
      Content: ['projects', 'posts'],
      Settings: ['profile', 'cv'],
    },
  },
  singletons: {
    profile: singleton({
      label: 'Profile',
      path: 'content/profile',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Full name' }),
        shortName: fields.text({ label: 'Short name' }),
        monogram: fields.text({ label: 'Monogram', validation: { length: { max: 3 } } }),
        headlineStart: fields.text({ label: 'Headline: before the italic word' }),
        headlineEmphasis: fields.text({ label: 'Headline: italic word' }),
        headlineEnd: fields.text({ label: 'Headline: after the italic word' }),
        intro: fields.text({ label: 'Intro paragraph', multiline: true }),
        location: fields.text({ label: 'Based in' }),
        focus: fields.text({ label: 'Focus' }),
        education: fields.text({ label: 'Education (short)' }),
        openToWork: fields.checkbox({ label: 'Open to opportunities', defaultValue: true }),
        email: fields.text({ label: 'Email' }),
        github: fields.url({ label: 'GitHub URL' }),
        linkedin: fields.url({ label: 'LinkedIn URL' }),
        cvFile: fields.file({
          label: 'CV (PDF)',
          directory: 'public/files',
          publicPath: '/files/',
        }),
        closingLine: fields.text({ label: 'Footer line' }),
        closingEmphasis: fields.text({ label: 'Footer line: italic part' }),
      },
    }),
    cv: singleton({
      label: 'CV',
      path: 'content/cv',
      format: { data: 'json' },
      schema: {
        entries: fields.array(
          fields.object({
            period: fields.text({ label: 'Period' }),
            title: fields.text({ label: 'Title' }),
            place: fields.text({ label: 'Place / detail' }),
          }),
          { label: 'Timeline', itemLabel: (p) => `${p.fields.period.value} — ${p.fields.title.value}` }
        ),
        skills: fields.array(fields.text({ label: 'Skill' }), {
          label: 'Stack',
          itemLabel: (p) => p.value,
        }),
        languages: fields.array(fields.text({ label: 'Language' }), {
          label: 'Languages',
          itemLabel: (p) => p.value,
        }),
      },
    }),
  },
  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'content/projects/*',
      format: { contentField: 'content' },
      columns: ['title', 'year'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        order: fields.integer({ label: 'Order (1 = first)', defaultValue: 10 }),
        featured: fields.checkbox({ label: 'Featured (big dark card on top)', defaultValue: false }),
        hidden: fields.checkbox({ label: 'Hide from the site', defaultValue: false }),
        year: fields.text({ label: 'Year' }),
        context: fields.text({ label: 'Context (e.g. Tec de Monterrey, Client work)' }),
        status: fields.text({ label: 'Status label (e.g. In progress, In production)' }),
        summary: fields.text({ label: 'One-line summary', multiline: true }),
        stack: fields.array(fields.text({ label: 'Tech' }), { label: 'Stack', itemLabel: (p) => p.value }),
        repoUrl: fields.url({ label: 'Repository URL' }),
        liveUrl: fields.url({ label: 'Live URL' }),
        cover: fields.image({
          label: 'Preview image (shown on hover and on the project page)',
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
        }),
        video: fields.url({ label: 'Preview video URL (optional, .mp4)' }),
        content: fields.markdoc({ label: 'Write-up' }),
      },
    }),
    posts: collection({
      label: 'Journal',
      slugField: 'title',
      path: 'content/posts/*',
      format: { contentField: 'content' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        kind: fields.select({
          label: 'Kind',
          options: [
            { label: 'Project write-up', value: 'Project write-up' },
            { label: 'Notes', value: 'Notes' },
            { label: 'Essay', value: 'Essay' },
          ],
          defaultValue: 'Project write-up',
        }),
        draft: fields.checkbox({ label: 'Draft (not published)', defaultValue: true }),
        summary: fields.text({ label: 'Summary (also good as your LinkedIn post intro)', multiline: true }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});
