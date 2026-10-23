/**
 * useIsMounted — hydration-safe client-mount detection using useSyncExternalStore.
 * Avoids cascading renders and react-hooks/set-state-in-effect linter errors.
 */

'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
