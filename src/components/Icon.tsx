/** Small inline SVG icons (decorative; always paired with visible text or an aria-label). */
const PATHS = {
  logo: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm3 1v4h4V7H7Zm6 0v4h4V7h-4Zm-6 6v4h4v-4H7Zm6 0v4h4v-4h-4Z',
  settings:
    'M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7.4-2.5a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1L11 21h4l.3-2.5c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  auto: 'M12 3a9 9 0 1 0 0 18V3Z M12 3a9 9 0 0 1 0 18',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z',
  image: 'M4 5h16v14H4V5Zm2 2v8l4-4 3 3 2-2 3 3V7H6Zm9 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4',
  trash: 'M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  upload: 'M12 20V9m0 0-4 4m4-4 4 4M5 4h14',
  close: 'M6 6l12 12M18 6 6 18',
  key: 'M14.5 4a5.5 5.5 0 0 0-5.2 7.3L3 17.6V21h3.4l1-1v-2h2v-2h2l1.3-1.3A5.5 5.5 0 1 0 14.5 4Zm1.5 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  strip: 'M3 6h5v12H3V6Zm6.5 0h5v12h-5V6ZM16 6h5v12h-5V6Z',
  stop: 'M7 7h10v10H7V7Z',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3v.5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-9v.5',
  check: 'M5 12.5 10 17l9-10',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Z',
} as const;

export type IconName = keyof typeof PATHS;

const STROKED: ReadonlySet<IconName> = new Set([
  'sun',
  'refresh',
  'edit',
  'trash',
  'download',
  'upload',
  'close',
  'stop',
  'alert',
  'info',
  'check',
  'lock',
  'auto',
]);

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const stroked = STROKED.has(name);
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={stroked ? 'none' : 'currentColor'}
      stroke={stroked ? 'currentColor' : 'none'}
      strokeWidth={stroked ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
