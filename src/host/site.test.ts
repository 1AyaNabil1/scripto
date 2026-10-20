import { LEGACY_KEY_ENTRY } from '../lib/settings';
import { createSiteHost } from './site';

describe('the free site host', () => {
  it('removes a key an earlier version kept in this browser', () => {
    window.localStorage.setItem(LEGACY_KEY_ENTRY, 'AIzaSyExampleExampleExample1234');
    createSiteHost('https://scripto-api.test').start();
    expect(window.localStorage.getItem(LEGACY_KEY_ENTRY)).toBeNull();
  });

  it('has no backend when no scene writer is configured, and never draws frames', () => {
    expect(createSiteHost('').createBackend()).toBeNull();
    const host = createSiteHost('https://scripto-api.test');
    expect(host.createBackend()?.kind).toBe('gemini');
    expect(host.drawsFrames).toBe(false);
  });
});
