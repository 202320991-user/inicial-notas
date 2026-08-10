import { useSyncExternalStore } from 'react';

const suscribir = () => () => undefined;

/**
 * Distingue el HTML inicial del cliente ya hidratado sin crear un efecto que
 * provoque una segunda actualización de estado manual.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(suscribir, () => true, () => false);
}
