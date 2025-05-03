/**
 * In-memory memo event bus for live updates.
 */

import type { TerMemo } from './ter-memo';

export interface TerMemoEvent {
  memo: TerMemo;
  hash?: string;
  createdAt: string;
}

const target = new EventTarget();
const EVENT_NAME = 'ter-memo';

export function publishTerMemoEvent(event: TerMemoEvent): void {
  target.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
}

export function subscribeTerMemoEvents(
  handler: (event: TerMemoEvent) => void
): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<TerMemoEvent>).detail);
  };
  target.addEventListener(EVENT_NAME, listener);
  return () => target.removeEventListener(EVENT_NAME, listener);
}
