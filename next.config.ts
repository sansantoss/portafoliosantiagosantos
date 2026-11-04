import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The share images read their fonts, photo and the content from disk; make sure they ship with the functions.
  outputFileTracingIncludes: {
    '/[lang]/opengraph-image*': ['./src/og/**/*', './content/**/*'],
    '/[lang]/projects/[slug]/opengraph-image*': ['./src/og/**/*', './content/**/*'],
  },
};

export default nextConfig;
