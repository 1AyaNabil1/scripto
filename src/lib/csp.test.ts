import { buildCsp, CSP_DIRECTIVES, cspDirectives, parseApiUrl } from './csp';

const API = 'https://scripto-api.vercel.app';

describe('content security policy', () => {
  it('lets the free site talk to itself and its scene writer only', () => {
    expect(cspDirectives('site', API)['connect-src']).toEqual(["'self'", API]);
    expect(new Set(buildCsp(cspDirectives('site', API)).match(/https?:\/\/[^\s;]+/g))).toEqual(new Set([API]));
  });

  it('names no other origin when no scene writer is configured', () => {
    expect(CSP_DIRECTIVES['connect-src']).toEqual(["'self'"]);
    expect(buildCsp()).not.toMatch(/https?:\/\//);
  });

  it('allows scripts and styles from the same origin only', () => {
    const csp = buildCsp(cspDirectives('site', API));
    expect(csp).toContain("script-src 'self';");
    expect(csp).toContain("style-src 'self';");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
  });

  it('lets the Zibby build talk to its own origin only', () => {
    expect(cspDirectives('zibby', API)['connect-src']).toEqual(["'self'"]);
    expect(buildCsp(cspDirectives('zibby'))).not.toMatch(/https?:\/\//);
  });
});

describe('the scene writer address', () => {
  it('keeps a plain https origin', () => {
    expect(parseApiUrl(API)).toBe(API);
    expect(parseApiUrl(`${API}/`)).toBe(API);
  });

  it('accepts plain http only on this machine', () => {
    expect(parseApiUrl('http://localhost:3000')).toBe('http://localhost:3000');
    expect(parseApiUrl('http://scripto-api.vercel.app')).toBe('');
  });

  it('rejects anything that is not just an origin', () => {
    for (const value of [undefined, '', 'scripto-api.vercel.app', `${API}/api`, `${API}?x=1`, 'https://u:p@example.com', 'javascript:alert(1)']) {
      expect(parseApiUrl(value)).toBe('');
    }
  });
});
