# sansantos.com

Portafolio personal de Santiago Santos. Next.js (App Router) + Keystatic como editor de contenido. Sin base de datos: todo el contenido vive en archivos dentro de `content/`, versionado en git.

## Correr en local

```bash
npm install
npm run dev
```

- Sitio: http://localhost:3000
- Editor: http://localhost:3000/keystatic (en local no pide login y guarda directo en `content/`)

## Dónde se edita cada cosa

| Qué | Desde el editor | Desde código |
| --- | --- | --- |
| Nombre, titular, intro, links, CV en PDF | Settings → Profile | `content/profile.json` |
| Timeline del CV, stack, idiomas | Settings → CV | `content/cv.json` |
| Proyectos | Content → Projects | `content/projects/*.mdoc` |
| Journal | Content → Journal | `content/posts/*.mdoc` |

En cada proyecto:
- **Order**: posición en la lista (1 = primero).
- **Featured**: lo muestra como la tarjeta oscura grande. Marca solo uno.
- **Hidden**: lo oculta sin borrarlo.
- **Preview image**: aparece al pasar el mouse sobre el proyecto y arriba de su página. Usa 4:3 o 16:9, ~1600 px de ancho.
- **Preview video**: un `.mp4` corto (sin audio, <10 MB) reemplaza a la imagen en la página del proyecto.

Los posts nuevos se crean como **Draft** y no se publican hasta que desmarcas esa casilla.

## Deploy en Vercel

1. Crea el repo `sansantoss/sansantos.com` en GitHub (puede ser privado) y sube este código:
   ```bash
   git remote add origin https://github.com/sansantoss/sansantos.com.git
   git push -u origin main
   ```
2. En vercel.com → Add New → Project → importa el repo. No cambies nada; Vercel detecta Next.js.
3. Dominio: Project → Settings → Domains → agrega `sansantos.com` y `www.sansantos.com`. Vercel te da los registros DNS (un `A` y un `CNAME`) para ponerlos donde compraste el dominio.

## Editor en producción (login con GitHub)

En producción el editor no puede escribir archivos en el servidor, así que se conecta a GitHub: cada vez que guardas, hace un commit al repo y Vercel redeploya solo (~1 min).

Configuración, una sola vez:

1. En local, crea un archivo `.env.local` con:
   ```
   NEXT_PUBLIC_KEYSTATIC_STORAGE=github
   ```
2. `npm run dev` y abre http://localhost:3000/keystatic. Te guía para crear una GitHub App; al terminar escribe en `.env.local` estas variables:
   `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
3. Copia esas 4 variables, más `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`, a Vercel → Settings → Environment Variables, y redeploya.
4. En la GitHub App (github.com/settings/apps), agrega como callback URL: `https://sansantos.com/api/keystatic/github/oauth/callback`.

Listo: entras a `sansantos.com/keystatic`, haces login con tu cuenta de GitHub y solo quien tenga acceso al repo puede editar.

> Nunca subas `.env.local` a git (ya está en `.gitignore`).

## Detalles técnicos

- **⌘K / Ctrl+K o `/`**: abre la paleta de comandos (navegar, proyectos, posts, copiar email, CV, tema claro/oscuro). Archivo: `src/components/command-palette.tsx`.
- **Tema claro/oscuro**: sigue el sistema; la paleta permite cambiarlo y se recuerda.
- **Animaciones al hacer scroll**: CSS nativo (`animation-timeline: view()`), sin JavaScript, y se desactivan con `prefers-reduced-motion`. Clase `.reveal` en `globals.css`.
- **Fuentes**: Instrument Serif, Geist y Geist Mono, servidas desde el propio sitio.
- **Ask my CV**: la sección está en el home como "en desarrollo"; el RAG real es la v2.
