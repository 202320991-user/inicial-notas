/**
 * Envoltura segura sobre localStorage: si el valor guardado está corrupto (JSON inválido),
 * si localStorage no está disponible (SSR) o si el navegador lo bloquea (modo privado,
 * cuota excedida), la app no se rompe: simplemente se comporta como si no hubiera nada
 * guardado en vez de lanzar una excepción no controlada.
 */

export function leerJSON<T>(clave: string, valorPorDefecto: T): T {
  if (typeof window === 'undefined') return valorPorDefecto;

  try {
    const crudo = window.localStorage.getItem(clave);
    if (!crudo || crudo.trim() === '') return valorPorDefecto;

    const parsed = JSON.parse(crudo) as T;
    return parsed;
  } catch (e) {
    console.error(`No se pudo leer "${clave}" de localStorage:`, e);
    try {
      window.localStorage.removeItem(clave);
    } catch (cleanupError) {
      console.error(`No se pudo limpiar "${clave}" de localStorage:`, cleanupError);
    }
    return valorPorDefecto;
  }
}

export function guardarJSON(clave: string, valor: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    console.error(`No se pudo guardar "${clave}" en localStorage:`, e);
    return false;
  }
}

export function eliminarClave(clave: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(clave);
  } catch (e) {
    console.error(`No se pudo eliminar "${clave}" de localStorage:`, e);
  }
}