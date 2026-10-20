/** The projector beam, halftone dots and starfield behind every page. Purely decorative. */
export function Background() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-glow" />
      <div className="backdrop-beam">
        <div className="beam-dots" />
        <div className="beam-core" />
      </div>
      <div className="backdrop-lamp" />
      <div className="backdrop-horizon" />
    </div>
  );
}
