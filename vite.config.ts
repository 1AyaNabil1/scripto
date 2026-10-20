/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { zibbyViteConfig } from '@zibby-run/app-kit/vite';
import { writeSampleManifest } from '@zibby-run/app-kit/publish';
import { buildCsp, cspDirectives, type CspHost } from './src/lib/csp.ts';
import { getStyle } from './src/lib/styles.ts';
import { buildZibbySample } from './src/lib/zibbyPayloads.ts';

const CHARSET_TAG = '<meta charset="UTF-8" />';

/**
 * Adds the Content-Security-Policy meta tag to the production HTML only,
 * right after the charset declaration so it precedes every script and style.
 */
function contentSecurityPolicy(host: CspHost): Plugin {
  return {
    name: 'scripto-csp',
    apply: 'build',
    transformIndexHtml(html) {
      if (!html.includes(CHARSET_TAG)) {
        throw new Error('index.html must contain <meta charset="UTF-8" /> for the CSP plugin');
      }
      const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(cspDirectives(host))}" />`;
      return html.replace(CHARSET_TAG, `${CHARSET_TAG}\n    ${meta}`);
    },
  };
}

/**
 * Writes dist/zibby-sample.json, the requests Zibby replays to price the app,
 * from the same builders the app uses. The kit's writer checks the platform's
 * bounds and fails the build if one is broken.
 */
function zibbySampleManifest(): Plugin {
  let outDir = 'dist';
  return {
    name: 'scripto-zibby-sample',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      writeSampleManifest(outDir, buildZibbySample(getStyle('sketch')));
    },
  };
}

export default defineConfig(({ mode }) => {
  // Zibby hands the build VITE_SCRIPTO_HOST=zibby from zibby.json's build.env.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const zibby = (process.env.VITE_SCRIPTO_HOST ?? env.VITE_SCRIPTO_HOST) === 'zibby';
  return {
    // GitHub Pages serves the site at /scripto/; Zibby serves the same bundle off a path prefix
    // in one lane and off the root of a per-app origin in the other, so it needs relative URLs.
    base: zibby ? zibbyViteConfig.base : '/scripto/',
    plugins: [react(), contentSecurityPolicy(zibby ? 'zibby' : 'byok'), ...(zibby ? [zibbySampleManifest()] : [])],
    resolve: {
      // One host implementation per bundle (src/host/types.ts).
      alias: { '@host': path.resolve(import.meta.dirname, `src/host/${zibby ? 'zibby' : 'byok'}.ts`) },
    },
    build: {
      sourcemap: false,
      target: 'es2022',
      ...(zibby ? { assetsInlineLimit: zibbyViteConfig.build.assetsInlineLimit } : {}),
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
