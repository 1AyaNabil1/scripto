import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// The scene writer's tests run in Node, with no page at all.
const hasDom = typeof window !== 'undefined';

// jsdom does not implement <dialog> methods; give it just enough behaviour.
const dialogProto = hasDom ? (HTMLDialogElement.prototype as Partial<HTMLDialogElement>) : {};
if (hasDom && typeof dialogProto.showModal !== 'function') {
  dialogProto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  dialogProto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

beforeEach(() => {
  if (hasDom) window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});
