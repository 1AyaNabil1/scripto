/** The S of Scripto drawn as a strip of film. Same path as public/favicon.svg. */
export const FILM_S_PATH = 'M86 36C86 20 34 20 34 40 34 60 86 56 86 78 86 100 34 100 34 84';

export function FilmS({ size = 28, hole = 'var(--ground)' }: { size?: number; hole?: string }) {
  return (
    <svg className="film-s" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path d={FILM_S_PATH} fill="none" stroke="var(--violet)" strokeWidth="24" />
      <path d={FILM_S_PATH} fill="none" stroke={hole} strokeWidth="13" strokeDasharray="9 5" />
    </svg>
  );
}

/** "[S]cripto": the film S stands in for the first letter. */
export function Logo() {
  return (
    <span className="logo" role="img" aria-label="Scripto">
      <FilmS />
      <span className="logo-word" aria-hidden="true">
        cripto
      </span>
    </span>
  );
}
