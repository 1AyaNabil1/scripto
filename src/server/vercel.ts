/**
 * Vercel entry for the scene writer. `npm run build:proxy` bundles it, with
 * everything it imports, into proxy/api/storyboard.js; proxy/ is what gets
 * deployed. Set GEMINI_API_KEY in the Vercel project (never in the repo), and
 * optionally ALLOWED_ORIGINS (comma-separated) and GEMINI_MODEL.
 */
import { createStoryboardHandler, DEFAULT_ORIGINS } from './storyboard';

const origins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const handler = createStoryboardHandler({
  apiKey: process.env.GEMINI_API_KEY ?? '',
  model: process.env.GEMINI_MODEL,
  allowedOrigins: origins.length > 0 ? origins : DEFAULT_ORIGINS,
  log: (line) => {
    console.error(line);
  },
});

export default { fetch: handler };
