import { useRef, type ChangeEvent } from 'react';
import { Icon } from './Icon';

interface Props {
  onImport: (file: File) => void;
  disabled?: boolean;
  label?: string;
}

/** "Open JSON" button backed by a hidden file input. */
export function ImportButton({ onImport, disabled = false, label = 'Open JSON' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onImport(file);
  };
  return (
    <>
      <button type="button" className="button ghost" onClick={() => fileRef.current?.click()} disabled={disabled}>
        <Icon name="upload" size={16} /> {label}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="import-input"
        onChange={pick}
      />
    </>
  );
}
