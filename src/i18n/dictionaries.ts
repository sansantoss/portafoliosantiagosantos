import type { Locale } from './config';

// Every piece of fixed interface text, in both languages.
const en = {
  tokens: { show: 'See it as tokens', hide: 'Back to words', tokens: 'tokens', model: 'o200k · GPT-4o tokenizer' },
  graph: {
    title: 'How it connects', lede: 'Projects and the technologies behind them. The same map will power Ask my CV.',
    legendProject: 'Project', legendTech: 'Technology', legendPost: 'Journal post', hint: 'Hover a node to see its connections',
  },
  chat: { title: 'Off the clock', lede: 'The drone asked. I answered.', drone: 'Drone', me: 'Santos' },
  achievements: {
    title: 'Achievements', unlocked: 'Achievement unlocked', close: 'Close', locked: '???', button: 'Achievements',
    items: {
      hello: { name: 'Hello, world', how: 'Visit the site' },
      explorer: { name: 'Explorer', how: 'Reach the end of the page' },
      palette: { name: 'Power user', how: 'Open the command menu (⌘K)' },
      polyglot: { name: 'Polyglot', how: 'Switch the language' },
      poke: { name: "Don't poke the drone", how: 'Click the drone' },
      backflip: { name: 'Backflip', how: 'Click the drone five times in a row' },
      typist: { name: 'Typist', how: 'Press ten keys on the stack keyboard' },
      reader: { name: 'Case reader', how: 'Open a project' },
      contact: { name: 'Say hi', how: 'Copy the email' },
      night: { name: 'Night owl', how: 'Switch to the dark theme' },
      tokens: { name: 'Tokenizer', how: 'See the headline as tokens' },
      graph: { name: 'Connected', how: 'Explore the graph' },
    } as Record<string, { name: string; how: string }>,
  },
  setup: { title: 'Setup', lede: 'The tools, hardware and homelab behind my work.', label: 'Uses' },
  intro: { words: ['Hola', 'Hello', 'Hallo', 'Bonjour'], skip: 'Skip' },
  card: { localTime: 'Local time', available: 'Available for work', busy: 'Busy right now' },
  categories: { all: 'All', client: 'Client work', ai: 'AI', experiments: 'Experiments', games: 'Games', academic: 'Academic' } as Record<string, string>,
  stack: {
    title: 'Stack', lede: 'Press the keys, or type on your keyboard.',
    cats: { all: 'All', ai: 'AI & data', backend: 'Backend', frontend: 'Frontend', languages: 'Languages', tools: 'Tools' } as Record<string, string>,
    sound: 'Sound', on: 'on', off: 'off',
  },
  progress: { label: 'Page sections', hero: 'Intro', projects: 'Projects', stack: 'Stack', graph: 'Graph', ask: 'Ask', more: 'Off the clock', journal: 'Journal' },
  foot: { links: 'Explore', contact: 'Contact', status: 'Status', time: 'Puebla time', top: 'Back to top' },
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
    onlyIn: 'This entry is only available in Spanish.', min: 'min read', all_: 'All',
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
  tokens: { show: 'Verlo como tokens', hide: 'Volver a palabras', tokens: 'tokens', model: 'o200k · tokenizador de GPT-4o' },
  graph: {
    title: 'Cómo se conecta', lede: 'Mis proyectos y las tecnologías detrás de ellos. Este mismo mapa alimentará Pregúntale a mi CV.',
    legendProject: 'Proyecto', legendTech: 'Tecnología', legendPost: 'Post del journal', hint: 'Pasa el mouse por un nodo para ver sus conexiones',
  },
  chat: { title: 'Fuera del código', lede: 'El drone preguntó. Yo respondí.', drone: 'Drone', me: 'Santos' },
  achievements: {
    title: 'Logros', unlocked: 'Logro desbloqueado', close: 'Cerrar', locked: '???', button: 'Logros',
    items: {
      hello: { name: 'Hola, mundo', how: 'Visita el sitio' },
      explorer: { name: 'Explorador', how: 'Llega al final de la página' },
      palette: { name: 'Usuario avanzado', how: 'Abre el menú de comandos (⌘K)' },
      polyglot: { name: 'Políglota', how: 'Cambia el idioma' },
      poke: { name: 'No piques al drone', how: 'Dale clic al drone' },
      backflip: { name: 'Mortal hacia atrás', how: 'Dale cinco clics seguidos al drone' },
      typist: { name: 'Mecanógrafo', how: 'Presiona diez teclas del teclado del stack' },
      reader: { name: 'Lector de casos', how: 'Abre un proyecto' },
      contact: { name: 'Saluda', how: 'Copia el email' },
      night: { name: 'Búho nocturno', how: 'Cambia al tema oscuro' },
      tokens: { name: 'Tokenizador', how: 'Ve el titular como tokens' },
      graph: { name: 'Conectado', how: 'Explora el grafo' },
    },
  },
  setup: { title: 'Setup', lede: 'Las herramientas, el equipo y el homelab detrás de mi trabajo.', label: 'Lo que uso' },
  intro: { words: ['Hola', 'Hello', 'Hallo', 'Bonjour'], skip: 'Saltar' },
  card: { localTime: 'Hora local', available: 'Disponible para trabajar', busy: 'Ocupado por ahora' },
  categories: { all: 'Todos', client: 'Clientes', ai: 'IA', experiments: 'Experimentos', games: 'Juegos', academic: 'Académicos' },
  stack: {
    title: 'Stack', lede: 'Presiona las teclas, o escribe con tu teclado.',
    cats: { all: 'Todo', ai: 'IA y datos', backend: 'Backend', frontend: 'Frontend', languages: 'Lenguajes', tools: 'Herramientas' },
    sound: 'Sonido', on: 'sí', off: 'no',
  },
  progress: { label: 'Secciones de la página', hero: 'Inicio', projects: 'Proyectos', stack: 'Stack', graph: 'Grafo', ask: 'Pregunta', more: 'Fuera del código', journal: 'Journal' },
  foot: { links: 'Explora', contact: 'Contacto', status: 'Estatus', time: 'Hora en Puebla', top: 'Volver arriba' },
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
    onlyIn: 'Esta entrada solo está disponible en inglés.', min: 'min de lectura', all_: 'Todo',
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
