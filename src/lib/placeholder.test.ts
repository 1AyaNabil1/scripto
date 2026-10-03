import { placeholderAlt, placeholderDataUrl, placeholderSvg } from './placeholder';
import { MOODS, SHOTS } from './types';
import { MOOD_INFO } from './vocabulary';

describe('placeholder frames', () => {
  it('renders a well-formed SVG for every shot and mood', () => {
    const parser = new DOMParser();
    for (const shot of SHOTS) {
      for (const mood of MOODS) {
        const svg = placeholderSvg({ shot, mood, intensity: 3 }, 0);
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        expect(doc.querySelector('parsererror'), `${shot}/${mood}`).toBeNull();
        expect(doc.documentElement.getAttribute('viewBox')).toBe('0 0 1600 900');
      }
    }
  });

  it('uses the mood gradient and labels the shot, scene number and intensity', () => {
    const svg = placeholderSvg({ shot: 'close-up', mood: 'tense', intensity: 4 }, 2);
    const [dark, light] = MOOD_INFO.tense.gradient;
    expect(svg).toContain(dark);
    expect(svg).toContain(light);
    expect(svg).toContain('CLOSE-UP');
    expect(svg).toContain('SCENE 03');
    expect(svg).toContain('TENSE');
    expect(svg).toContain('●●●●○');
  });

  it('clamps out-of-range intensity', () => {
    expect(placeholderSvg({ shot: 'wide', mood: 'calm', intensity: 99 }, 0)).toContain('●●●●●');
    expect(placeholderSvg({ shot: 'wide', mood: 'calm', intensity: -3 }, 0)).toContain('●○○○○');
  });

  it('encodes the SVG as a data URL', () => {
    const url = placeholderDataUrl({ shot: 'aerial', mood: 'hopeful', intensity: 2 }, 0);
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(url).not.toMatch(/[<>"#]/);
  });

  it('describes the frame for screen readers', () => {
    expect(placeholderAlt({ shot: 'low-angle', mood: 'dramatic' }, 0)).toBe(
      'Placeholder frame for scene 1: low angle, dramatic mood',
    );
  });
});
