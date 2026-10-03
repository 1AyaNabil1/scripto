import { buildCsp, CSP_DIRECTIVES, GOOGLE_API_ORIGIN } from './csp';

describe('content security policy', () => {
  it('only lets the page talk to itself and the Gemini API', () => {
    expect(CSP_DIRECTIVES['connect-src']).toEqual(["'self'", GOOGLE_API_ORIGIN]);
    expect(GOOGLE_API_ORIGIN).toBe('https://generativelanguage.googleapis.com');
  });

  it('allows scripts and styles from the same origin only', () => {
    const csp = buildCsp();
    expect(csp).toContain("script-src 'self';");
    expect(csp).toContain("style-src 'self';");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
  });

  it('names no third-party origin other than Google', () => {
    const origins = buildCsp().match(/https?:\/\/[^\s;]+/g) ?? [];
    expect(new Set(origins)).toEqual(new Set([GOOGLE_API_ORIGIN]));
  });
});
