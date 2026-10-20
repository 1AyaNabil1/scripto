/** Small inline stroke icons (decorative; always paired with visible text or an aria-label). */
const PATHS = {
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  image: 'M3 5h18v14H3V5Zm0 10 5-5 4 4 3-3 6 6',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
  upload: 'M12 20V9m0 0-4 4m4-4 4 4M5 4h14',
  close: 'M6 6l12 12M18 6 6 18',
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  film: 'M2 5h20v14H2V5Zm4 4h5v6H6V9Zm7 0h5v6h-5V9ZM5 7h1m3 0h1m3 0h1m3 0h1M5 17h1m3 0h1m3 0h1m3 0h1',
  stop: 'M7 7h10v10H7V7Z',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3v.5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-9v.5',
  check: 'M5 12.5 10 17l9-10',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Z',
  plus: 'M12 5v14M5 12h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  key: 'M8 15a4 4 0 1 0 0-.01M11 12l9-9M17 6l3 3',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
