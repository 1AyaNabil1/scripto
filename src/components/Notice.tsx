import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  tone: 'error' | 'warning' | 'info';
  title: string;
  children?: ReactNode;
  detail?: string | undefined;
  onDismiss?: () => void;
}

/** Inline message. Errors are announced immediately; other tones politely. */
export function Notice({ tone, title, children, detail, onDismiss }: Props) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={tone === 'info' ? 'info' : 'alert'} />
      <div className="notice-body">
        <p className="notice-title">{title}</p>
        {children && <div className="notice-text">{children}</div>}
        {detail && (
          <details className="notice-detail">
            <summary>Details from Google</summary>
            <p dir="auto">{detail}</p>
          </details>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="icon-button" onClick={onDismiss} aria-label={`Dismiss: ${title}`}>
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
