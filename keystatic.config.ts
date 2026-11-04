import { config, fields, collection, singleton } from '@keystatic/core';

// Local mode: edit at http://localhost:3000/keystatic and changes are written to the files in /content.
// GitHub mode: set NEXT_PUBLIC_KEYSTATIC_STORAGE=github in Vercel and edit at sansantos.com/keystatic
// (log in with GitHub; each save becomes a commit and Vercel redeploys). See README.
const useGithub = process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github';

// Convention: plain fields are English; fields ending in "(ES)" are the Spanish version.
// Any Spanish field left empty falls back to the English one on /es.
const es = (label: string) => `${label} (ES)`;

export default config({
  storage: useGithub
    ? { kind: 'github', repo: { owner: 'sansantoss', name: 'portafoliosantiagosantos' } }
    : { kind: 'local' },
  ui: {
    brand: { name: 'sansantos.com' },
    navigation: {
      Content: ['projects', 'posts'],
      Settings: ['profile', 'cv', 'chat', 'setup'],
    },
  },
  singletons: {
    profile: singleton({
      label: 'Profile',
      path: 'content/profile',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Full name' }),
        avatar: fields.image({
          label: 'Photo or avatar for the profile card (square). Empty = monogram.',
          directory: 'public/images/profile',
          publicPath: '/images/profile/',
        }),
        role: fields.text({ label: 'Role (profile card)' }),
        roleEs: fields.text({ label: es('Role (profile card)') }),
        shortName: fields.text({ label: 'Short name' }),
        monogram: fields.text({ label: 'Monogram', validation: { length: { max: 3 } } }),
        headlineStart: fields.text({ label: 'Headline: before the italic word' }),
        headlineEmphasis: fields.text({ label: 'Headline: italic word' }),
        headlineEnd: fields.text({ label: 'Headline: after the italic word' }),
        headlineStartEs: fields.text({ label: es('Headline: before the italic word') }),
        headlineEmphasisEs: fields.text({ label: es('Headline: italic word') }),
        headlineEndEs: fields.text({ label: es('Headline: after the italic word') }),
        intro: fields.text({ label: 'Intro paragraph', multiline: true }),
        introEs: fields.text({ label: es('Intro paragraph'), multiline: true }),
        location: fields.text({ label: 'Based in' }),
        locationEs: fields.text({ label: es('Based in') }),
        focus: fields.text({ label: 'Focus' }),
        focusEs: fields.text({ label: es('Focus') }),
        education: fields.text({ label: 'Education (short)' }),
        educationEs: fields.text({ label: es('Education (short)') }),
        openToWork: fields.checkbox({ label: 'Open to opportunities', defaultValue: true }),
        email: fields.text({ label: 'Email' }),
        github: fields.url({ label: 'GitHub URL' }),
        linkedin: fields.url({ label: 'LinkedIn URL' }),
        cvFile: fields.file({ label: 'CV (PDF, English)', directory: 'public/files', publicPath: '/files/' }),
        cvFileEs: fields.file({ label: es('CV (PDF)'), directory: 'public/files', publicPath: '/files/' }),
        closingLine: fields.text({ label: 'Footer line' }),
        closingEmphasis: fields.text({ label: 'Footer line: italic part' }),
        closingLineEs: fields.text({ label: es('Footer line') }),
        closingEmphasisEs: fields.text({ label: es('Footer line: italic part') }),
        quote: fields.text({ label: 'Footer quote (optional)' }),
        quoteEs: fields.text({ label: es('Footer quote (optional)') }),
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
            titleEs: fields.text({ label: es('Title') }),
            place: fields.text({ label: 'Place / detail' }),
            placeEs: fields.text({ label: es('Place / detail') }),
          }),
          { label: 'Timeline', itemLabel: (p) => `${p.fields.period.value} — ${p.fields.title.value}` }
        ),
        skills: fields.array(
          fields.object({
            name: fields.text({ label: 'Skill' }),
            category: fields.select({
              label: 'Category',
              options: [
                { label: 'AI & data', value: 'ai' },
                { label: 'Backend', value: 'backend' },
                { label: 'Frontend', value: 'frontend' },
                { label: 'Languages', value: 'languages' },
                { label: 'Tools', value: 'tools' },
              ],
              defaultValue: 'tools',
            }),
          }),
          { label: 'Stack (shown as a keyboard)', itemLabel: (p) => `${p.fields.name.value} · ${p.fields.category.value}` }
        ),
        languages: fields.array(
          fields.object({
            en: fields.text({ label: 'In English (e.g. Spanish (native))' }),
            es: fields.text({ label: 'En español (ej. Español (nativo))' }),
          }),
          { label: 'Languages', itemLabel: (p) => p.fields.en.value }
        ),
      },
    }),
    chat: singleton({
      label: 'Hobbies chat (with the drone)',
      path: 'content/chat',
      format: { data: 'json' },
      schema: {
        messages: fields.array(
          fields.object({
            from: fields.select({ label: 'Who speaks', options: [{ label: 'Drone (asks)', value: 'drone' }, { label: 'Me', value: 'me' }], defaultValue: 'me' }),
            text: fields.text({ label: 'Message', multiline: true }),
            textEs: fields.text({ label: es('Message'), multiline: true }),
          }),
          { label: 'Messages', itemLabel: (p) => `${p.fields.from.value === 'drone' ? '🤖' : '🙂'} ${p.fields.text.value}` }
        ),
      },
    }),
    setup: singleton({
      label: 'Setup / Uses page',
      path: 'content/setup',
      format: { data: 'json' },
      schema: {
        groups: fields.array(
          fields.object({
            title: fields.text({ label: 'Group (e.g. Desk, Software, Homelab)' }),
            titleEs: fields.text({ label: es('Group') }),
            items: fields.array(
              fields.object({
                name: fields.text({ label: 'Name' }),
                note: fields.text({ label: 'Why I use it (optional)' }),
                noteEs: fields.text({ label: es('Why I use it') }),
                url: fields.url({ label: 'Link (optional)' }),
              }),
              { label: 'Items', itemLabel: (p) => p.fields.name.value }
            ),
          }),
          { label: 'Groups', itemLabel: (p) => p.fields.title.value }
        ),
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
        titleEs: fields.text({ label: es('Title') }),
        order: fields.integer({ label: 'Order (1 = first)', defaultValue: 10 }),
        featured: fields.checkbox({ label: 'Featured (big dark card on top)', defaultValue: false }),
        category: fields.select({
          label: 'Category (tabs in the projects section)',
          options: [
            { label: 'Client work', value: 'client' },
            { label: 'AI', value: 'ai' },
            { label: 'Experiments', value: 'experiments' },
            { label: 'Games', value: 'games' },
            { label: 'Academic', value: 'academic' },
          ],
          defaultValue: 'experiments',
        }),
        hidden: fields.checkbox({ label: 'Hide from the site', defaultValue: false }),
        year: fields.text({ label: 'Year' }),
        context: fields.text({ label: 'Context (e.g. Tec de Monterrey, Client work)' }),
        contextEs: fields.text({ label: es('Context') }),
        status: fields.text({ label: 'Status label (e.g. In progress, In production)' }),
        statusEs: fields.text({ label: es('Status label') }),
        summary: fields.text({ label: 'One-line summary', multiline: true }),
        summaryEs: fields.text({ label: es('One-line summary'), multiline: true }),
        stack: fields.array(fields.text({ label: 'Tech' }), { label: 'Stack', itemLabel: (p) => p.value }),
        // SB-OS (/play): the world this project is in the space portfolio. See the Atlas for previews.
        planet: fields.select({
          label: 'SB-OS planet',
          description: 'Auto = a world picked from the project name (always the same one).',
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Atl · ocean', value: 'atl' },
            { label: 'Tonatiuh · desert', value: 'tonatiuh' },
            { label: 'Popoca · lava', value: 'popoca' },
            { label: 'Cetl · ice', value: 'cetl' },
            { label: 'Xochitl · jungle', value: 'xochitl' },
            { label: 'Mixtli · gas giant', value: 'mixtli' },
            { label: 'Citlali · ice giant', value: 'citlali' },
            { label: 'Tetl · rocky moon', value: 'tetl' },
            { label: 'Ehecatl · storm giant', value: 'ehecatl' },
            { label: 'Tlalli · inhabited', value: 'tlalli' },
          ],
          defaultValue: 'auto',
        }),
        moons: fields.integer({ label: 'SB-OS moons (0–4)', defaultValue: 0, validation: { min: 0, max: 4 } }),
        rings: fields.select({
          label: 'SB-OS rings',
          options: [
            { label: 'Default for the planet', value: 'default' },
            { label: 'None', value: 'none' },
            { label: 'Rings', value: 'rings' },
            { label: 'Asteroid belt', value: 'belt' },
            { label: 'Rings and asteroids', value: 'both' },
          ],
          defaultValue: 'default',
        }),
        repoUrl: fields.url({ label: 'Repository URL' }),
        liveUrl: fields.url({ label: 'Live site URL (button "Visit site")' }),
        demoUrl: fields.url({ label: 'Interactive demo URL (button "Try it live")' }),
        cover: fields.image({
          label: 'Cover image (hover preview in the list + top of the project page). 16:10 works best.',
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
        }),
        video: fields.file({
          label: 'Preview video (.mp4, muted, 5–12 s, under ~8 MB). Plays on hover and on the project page.',
          directory: 'public/videos',
          publicPath: '/videos/',
        }),
        gallery: fields.array(
          fields.object({
            image: fields.image({ label: 'Image', directory: 'public/images/projects', publicPath: '/images/projects/' }),
            caption: fields.text({ label: 'Caption' }),
            captionEs: fields.text({ label: es('Caption') }),
          }),
          { label: 'Gallery (screenshots)', itemLabel: (p) => p.fields.caption.value || 'Image' }
        ),
        content: fields.markdoc({ label: 'Write-up' }),
        contentEs: fields.markdoc({ label: es('Write-up') }),
      },
    }),
    posts: collection({
      label: 'Journal',
      slugField: 'title',
      path: 'content/posts/*',
      format: { contentField: 'content' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title (in the language you wrote it)' } }),
        language: fields.select({
          label: 'Language this post was written in',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Español', value: 'es' },
          ],
          defaultValue: 'en',
        }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        kind: fields.select({
          label: 'Kind',
          options: [
            { label: 'Project write-up', value: 'writeup' },
            { label: 'Notes', value: 'notes' },
            { label: 'Essay', value: 'essay' },
          ],
          defaultValue: 'writeup',
        }),
        draft: fields.checkbox({ label: 'Draft (not published)', defaultValue: true }),
        summary: fields.text({ label: 'Summary (also good as your LinkedIn post intro)', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: (p) => p.value }),
        content: fields.markdoc({ label: 'Content' }),
        translationTitle: fields.text({ label: 'Translation: title (optional, in the other language)' }),
        translationSummary: fields.text({ label: 'Translation: summary', multiline: true }),
        translationContent: fields.markdoc({ label: 'Translation: content' }),
      },
    }),
  },
});
