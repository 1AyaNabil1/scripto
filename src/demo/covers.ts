/**
 * Hand-drawn cover sketches for the gallery, one per sample board, so the
 * three cards do not look alike while the samples have no generated frames.
 */
import { svgToDataUrl } from '../lib/placeholder';

const V = '#ae8df9';
const INK = '#e4e4e7';

const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" width="1600" height="900" preserveAspectRatio="xMidYMid slice">';

const lanterns = [14, 40, 66, 96, 124, 150]
  .map((x, i) => {
    const y = [21, 26, 24, 21, 22, 19][i] ?? 22;
    const r = [2.2, 1.9, 1.6, 1.6, 1.9, 2.2][i] ?? 2;
    return `<circle cx="${x}" cy="${y}" r="${r * 3.2}" fill="${V}" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="${V}"/>`;
  })
  .join('');

const COVERS: Record<string, string> = {
  clockmaker: `${open}<rect width="160" height="90" fill="#0d0d10"/><path d="M0 90L68 60M160 90L92 60M0 60H160" stroke="#26262c" stroke-width=".6"/><path d="M-4 16Q40 30 80 22T164 18" stroke="#34343c" stroke-width=".5" fill="none"/>${lanterns}<rect x="73" y="48" width="14" height="12" fill="#15151a" stroke="#44444d" stroke-width=".4"/><circle cx="80" cy="54" r="2.4" fill="none" stroke="${V}" stroke-width=".5"/><circle cx="90" cy="54.4" r="1.1" fill="${INK}"/><rect x="89.1" y="55.7" width="1.8" height="4.3" rx=".9" fill="${INK}"/><g stroke="#fff" stroke-opacity=".07" stroke-width=".35"><path d="M10 34l-2 6M30 40l-2 6M52 32l-2 6M74 38l-2 6M104 34l-2 6M128 40l-2 6M146 32l-2 6"/></g></svg>`,
  bottle: `${open}<rect width="160" height="90" fill="#0b0b10"/><circle cx="118" cy="40" r="16" fill="${V}" opacity=".14"/><circle cx="118" cy="40" r="7" fill="${V}" opacity=".85"/><path d="M0 46H160" stroke="#3a3a44" stroke-width=".6"/><g fill="none" stroke="#2c2c35" stroke-width=".7"><path d="M0 54q10-3 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0"/><path d="M0 62q10-3 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0"/><path d="M0 70q10-3 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0"/></g><path d="M0 78l30-6 22 8 18-4v14H0z" fill="#16161c"/><g transform="rotate(-24 50 74)"><rect x="44" y="70" width="14" height="6" rx="3" fill="#d4d4d8" opacity=".9"/><rect x="58" y="71.5" width="4" height="3" rx="1" fill="${V}"/></g></svg>`,
  lighthouse: `${open}<rect width="160" height="90" fill="#0a0a0e"/><path d="M84 26L160 6V40Z" fill="${V}" opacity=".14"/><path d="M76 26L0 12V44Z" fill="${V}" opacity=".08"/><path d="M74 30h12l4 46H70z" fill="#d4d4d8"/><g fill="#0a0a0e"><rect x="72" y="42" width="16" height="4"/><rect x="71" y="56" width="18" height="4"/></g><rect x="73" y="22" width="14" height="8" fill="#1d1d24" stroke="#d4d4d8" stroke-width=".6"/><circle cx="80" cy="26" r="2.6" fill="${V}"/><path d="M0 76h160v14H0z" fill="#121218"/><path d="M0 82q10-2 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#2c2c35" stroke-width=".6"/><g fill="#fff" opacity=".35"><circle cx="20" cy="18" r=".6"/><circle cx="44" cy="10" r=".5"/><circle cx="132" cy="54" r=".5"/><circle cx="148" cy="60" r=".6"/></g></svg>`,
};

/** A data URL for the sample's cover, or undefined to fall back to its first frame. */
export function coverFor(demoId: string): string | undefined {
  const svg = COVERS[demoId];
  return svg ? svgToDataUrl(svg) : undefined;
}
