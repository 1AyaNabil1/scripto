/** The own-key site's header pill: whether a Gemini key is saved in this browser. */
export function KeyStatus({ apiKey, onOpenSettings }: { apiKey: string; onOpenSettings: () => void }) {
  return (
    <button type="button" className={`pill status-pill${apiKey ? ' is-on' : ''}`} onClick={onOpenSettings}>
      {apiKey ? 'Key saved' : 'No key'}
      <span className="status-dot" aria-hidden="true" />
    </button>
  );
}
