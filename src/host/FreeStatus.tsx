/** The free site's header pill: scenes cost nothing here and need no key. */
export function FreeStatus() {
  return (
    <span className="pill status-pill is-on" title="Scenes are free here. No key, no sign-up.">
      Free
      <span className="status-dot" aria-hidden="true" />
    </span>
  );
}
