import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { TABS, type TabId } from './tabs';

interface Props {
  tab: TabId;
  onTab: (tab: TabId) => void;
  status: ReactNode;
  /** Left out where there is nothing to set (the free site). */
  onOpenSettings?: (() => void) | undefined;
}

export function Header({ tab, onTab, status, onOpenSettings }: Props) {
  return (
    <header className="topbar">
      <a className="topbar-brand" href={import.meta.env.BASE_URL} aria-label="Scripto home">
        <Logo />
      </a>
      <nav className="tabs" aria-label="Sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab${item.id === tab ? ' is-active' : ''}`}
            aria-current={item.id === tab ? 'page' : undefined}
            onClick={() => {
              onTab(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="topbar-actions">
        {status}
        {onOpenSettings && (
          <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="Settings" title="Settings">
            <Icon name="sliders" />
          </button>
        )}
      </div>
    </header>
  );
}
