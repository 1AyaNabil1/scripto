/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { buildCsp } from './src/lib/csp.ts';

const CHARSET_TAG = '<meta charset="UTF-8" />';

/**
 * Adds the Content-Security-Policy meta tag to the production HTML only,
 * right after the charset declaration so it precedes every script and style.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'scripto-csp',
    apply: 'build',
    transformIndexHtml(html) {
      if (!html.includes(CHARSET_TAG)) {
        throw new Error('index.html must contain <meta charset="UTF-8" /> for the CSP plugin');
      }
      const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp()}" />`;
      return html.replace(CHARSET_TAG, `${CHARSET_TAG}\n    ${meta}`);
    },
  };
}

export default defineConfig({
  base: '/scripto/',
  plugins: [react(), contentSecurityPolicy()],
  build: {
    sourcemap: false,
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
