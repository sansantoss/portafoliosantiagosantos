import type { Locale } from './config';

// Every piece of fixed interface text, in both languages.
const en = {
  meta: { role: 'Software & AI engineering' },
  nav: { projects: 'Projects', journal: 'Journal', cv: 'CV', contact: 'Contact', home: 'home', menu: 'Open command menu', skip: 'Skip to content', language: 'Language' },
  hero: { seeProjects: 'See projects', downloadCv: 'Download CV' },
  facts: { basedIn: 'Based in', focus: 'Focus', education: 'Education', status: 'Status', open: 'Open to opportunities', closed: 'Not looking right now' },
  projects: {
    title: 'Projects', featured: 'Featured', caseStudy: 'Read the case study', all: 'All projects',
    stack: 'Stack', year: 'Year', code: 'Code', repo: 'Repository', live: 'Live', visit: 'Visit site', demo: 'Demo', tryIt: 'Try it live', gallery: 'Gallery',
  },
  ask: {
    label: 'Ask my CV', titleStart: 'Ask anything', titleEm: 'about my work.',
    body: "I'm building a small retrieval system over my CV, projects and journal. Every answer will cite where it came from, and if something isn't in my documents it will say so instead of guessing.",
    question: 'Your question', placeholder: 'What AI work has he done?', button: 'Ask', status: 'In development — follow the build in the journal',
  },
  journal: {
    title: 'Journal', label: 'Build log', lede: 'Write-ups of what I build and what I learn along the way.',
    empty: 'First entries are on the way: write-ups of how each project was built.', all: 'All entries', back: 'Journal',
    kinds: { writeup: 'Project write-up', notes: 'Notes', essay: 'Essay' } as Record<string, string>,
    onlyIn: 'This entry is only available in Spanish.',
  },
  cv: { title: 'CV', lang: 'Lang', download: 'Download full CV (PDF)' },
  footer: { press: 'Press ⌘K', emailCopied: 'Email copied' },
  notFound: { label: '404 — Lost signal', title: 'Nothing', em: 'here.', body: 'The page moved or never existed. My drone looked everywhere. Press ⌘K to search, or head back home.', back: 'Back home' },
  palette: {
    placeholder: 'Search projects, posts, actions…', empty: 'Nothing found. Try “resnet” or “email”.',
    ask: 'Ask my CV', askAction: 'Ask my CV a question', askPrefix: 'Ask', soon: 'soon',
    goTo: 'Go to', home: 'Home', projects: 'Projects', journal: 'Journal', cv: 'CV', actions: 'Actions',
    copyEmail: 'Copy email', downloadCv: 'Download CV (PDF)', github: 'Open GitHub', linkedin: 'Open LinkedIn',
    theme: 'Switch theme', switchLang: 'Ver en español', dark: 'Dark theme', light: 'Light theme',
    navigate: 'navigate', open: 'open', close: 'close',
  },
};

const es: typeof en = {
  meta: { role: 'Ingeniería de software e IA' },
  nav: { projects: 'Proyectos', journal: 'Journal', cv: 'CV', contact: 'Contacto', home: 'inicio', menu: 'Abrir menú de comandos', skip: 'Ir al contenido', language: 'Idioma' },
  hero: { seeProjects: 'Ver proyectos', downloadCv: 'Descargar CV' },
  facts: { basedIn: 'Ubicación', focus: 'Enfoque', education: 'Formación', status: 'Estatus', open: 'Abierto a oportunidades', closed: 'Sin buscar por ahora' },
  projects: {
    title: 'Proyectos', featured: 'Destacado', caseStudy: 'Ver el caso completo', all: 'Todos los proyectos',
    stack: 'Stack', year: 'Año', code: 'Código', repo: 'Repositorio', live: 'En línea', visit: 'Visitar sitio', demo: 'Demo', tryIt: 'Pruébalo en vivo', gallery: 'Galería',
  },
  ask: {
    label: 'Pregúntale a mi CV', titleStart: 'Pregunta lo que sea', titleEm: 'sobre mi trabajo.',
    body: 'Estoy construyendo un pequeño sistema de recuperación sobre mi CV, mis proyectos y mi journal. Cada respuesta citará de dónde salió, y si algo no está en mis documentos lo dirá en lugar de inventarlo.',
    question: 'Tu pregunta', placeholder: '¿Qué ha hecho con IA?', button: 'Preguntar', status: 'En desarrollo — sigue el avance en el journal',
  },
  journal: {
    title: 'Journal', label: 'Bitácora', lede: 'Notas sobre lo que construyo y lo que aprendo en el camino.',
    empty: 'Las primeras entradas vienen en camino: cómo se construyó cada proyecto.', all: 'Todas las entradas', back: 'Journal',
    kinds: { writeup: 'Caso de proyecto', notes: 'Notas', essay: 'Ensayo' },
    onlyIn: 'Esta entrada solo está disponible en inglés.',
  },
  cv: { title: 'CV', lang: 'Idiomas', download: 'Descargar CV completo (PDF)' },
  footer: { press: 'Presiona ⌘K', emailCopied: 'Email copiado' },
  notFound: { label: '404 — Sin señal', title: 'Aquí no hay', em: 'nada.', body: 'La página se movió o nunca existió. Mi drone buscó por todos lados. Presiona ⌘K para buscar, o vuelve al inicio.', back: 'Volver al inicio' },
  palette: {
    placeholder: 'Busca proyectos, posts, acciones…', empty: 'Nada por aquí. Prueba “resnet” o “email”.',
    ask: 'Pregúntale a mi CV', askAction: 'Hazle una pregunta a mi CV', askPrefix: 'Preguntar', soon: 'pronto',
    goTo: 'Ir a', home: 'Inicio', projects: 'Proyectos', journal: 'Journal', cv: 'CV', actions: 'Acciones',
    copyEmail: 'Copiar email', downloadCv: 'Descargar CV (PDF)', github: 'Abrir GitHub', linkedin: 'Abrir LinkedIn',
    theme: 'Cambiar tema', switchLang: 'View in English', dark: 'Tema oscuro', light: 'Tema claro',
    navigate: 'navegar', open: 'abrir', close: 'cerrar',
  },
};

export type Dictionary = typeof en;
const dictionaries: Record<Locale, Dictionary> = { en, es };
export const getDictionary = (lang: Locale) => dictionaries[lang];
