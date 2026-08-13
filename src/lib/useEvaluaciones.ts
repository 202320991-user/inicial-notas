'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { EvaluacionGuardada } from '@/types';

type RespuestaDrive = {
  ok: boolean;
  total?: number;
  evaluaciones?: EvaluacionGuardada[];
  error?: string;
};

type RespuestaEliminar = {
  ok: boolean;
  mensaje?: string;
  evaluacionId?: string;
  jsonEliminados?: number;
  excelEliminados?: number;
  error?: string;
};

type CachePersistente = {
  guardadoEn: number;
  evaluaciones: EvaluacionGuardada[];
};

const CACHE_STORAGE_KEY =
  'evaluaciones_drive_cache_v2';

/**
 * Evita volver a consultar Drive al navegar rápidamente
 * entre Drive / Alumnos / Reportes.
 */
const CACHE_FRESCA_MS = 30_000;

let cacheEvaluaciones:
  | EvaluacionGuardada[]
  | null = null;

let ultimaCarga = 0;

let cachePersistenteLeida = false;

let cargaEnCurso:
  | Promise<EvaluacionGuardada[]>
  | null = null;

/**
 * Los hooks montados se suscriben para recibir cambios
 * cuando una evaluación se guarda o elimina desde otra pantalla.
 */
const suscriptores =
  new Set<
    (evaluaciones: EvaluacionGuardada[]) => void
  >();

function ordenarEvaluaciones(
  evaluaciones: EvaluacionGuardada[]
): EvaluacionGuardada[] {
  return [...evaluaciones].sort((a, b) => {
    const fechaA =
      a.actualizadoEn ||
      a.fecha ||
      '';

    const fechaB =
      b.actualizadoEn ||
      b.fecha ||
      '';

    return fechaB.localeCompare(fechaA);
  });
}

function guardarCachePersistente() {
  if (
    typeof window === 'undefined' ||
    cacheEvaluaciones === null
  ) {
    return;
  }

  try {
    const payload: CachePersistente = {
      guardadoEn: ultimaCarga,
      evaluaciones: cacheEvaluaciones,
    };

    window.localStorage.setItem(
      CACHE_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch (error) {
    console.warn(
      'No se pudo guardar la caché local de evaluaciones:',
      error
    );
  }
}

function hidratarCachePersistente() {
  if (
    cachePersistenteLeida ||
    typeof window === 'undefined'
  ) {
    return;
  }

  cachePersistenteLeida = true;

  try {
    const texto =
      window.localStorage.getItem(
        CACHE_STORAGE_KEY
      );

    if (!texto) return;

    const payload =
      JSON.parse(texto) as CachePersistente;

    if (
      !payload ||
      !Array.isArray(payload.evaluaciones)
    ) {
      return;
    }

    cacheEvaluaciones =
      ordenarEvaluaciones(
        payload.evaluaciones
      );

    ultimaCarga =
      Number(payload.guardadoEn) || 0;
  } catch (error) {
    console.warn(
      'No se pudo recuperar la caché local de evaluaciones:',
      error
    );
  }
}

function publicarCache() {
  if (!cacheEvaluaciones) return;

  const copia = [...cacheEvaluaciones];

  suscriptores.forEach((suscriptor) => {
    suscriptor(copia);
  });
}

function establecerCache(
  evaluaciones: EvaluacionGuardada[],
  guardadoEn = Date.now()
) {
  cacheEvaluaciones =
    ordenarEvaluaciones(evaluaciones);

  ultimaCarga = guardadoEn;

  guardarCachePersistente();
  publicarCache();
}

/**
 * Se llama después de que Drive confirmó un guardado.
 * Así Drive / Alumnos / Reportes ven la evaluación nueva
 * o actualizada inmediatamente, sin esperar otro listado.
 */
export function actualizarCacheEvaluacion(
  evaluacion: EvaluacionGuardada
) {
  hidratarCachePersistente();

  const actuales =
    cacheEvaluaciones || [];

  const nuevas =
    actuales.filter(
      (item) => item.id !== evaluacion.id
    );

  nuevas.push(evaluacion);

  establecerCache(nuevas);
}

/**
 * Conserva los datos visibles pero hace que la próxima
 * carga consulte Drive aunque la caché sea reciente.
 */
export function invalidarCacheEvaluaciones() {
  hidratarCachePersistente();

  ultimaCarga = 0;
  guardarCachePersistente();
}

/**
 * Devuelve una evaluación desde la caché compartida.
 *
 * Se usa al abrir Editar / Evaluar / Vista Previa para evitar
 * otra llamada a /api/drive/obtener cuando la evaluación ya
 * fue cargada previamente por Drive, Alumnos o Reportes.
 */
export function obtenerEvaluacionCache(
  id: string
): EvaluacionGuardada | null {
  const evaluacionId = id.trim();

  if (!evaluacionId) {
    return null;
  }

  hidratarCachePersistente();

  if (!cacheEvaluaciones) {
    return null;
  }

  return (
    cacheEvaluaciones.find(
      (evaluacion) =>
        String(evaluacion.id) ===
        evaluacionId
    ) || null
  );
}

async function cargarDesdeDrive(): Promise<
  EvaluacionGuardada[]
> {
  if (cargaEnCurso) {
    return cargaEnCurso;
  }

  const operacion = (async () => {
    const response = await fetch(
      '/api/drive/listar',
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    const data: RespuestaDrive =
      await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error ||
          'No se pudieron cargar las evaluaciones desde Google Drive.'
      );
    }

    const nuevas =
      Array.isArray(data.evaluaciones)
        ? data.evaluaciones
        : [];

    establecerCache(nuevas);

    return nuevas;
  })();

  cargaEnCurso = operacion;

  try {
    return await operacion;
  } finally {
    if (cargaEnCurso === operacion) {
      cargaEnCurso = null;
    }
  }
}

export function useEvaluaciones() {
  const [evaluaciones, setEvaluaciones] =
    useState<EvaluacionGuardada[]>([]);

  const [cargado, setCargado] =
    useState(false);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState('');

  const recargar = useCallback(
    async (forzar = true) => {
      setError('');

      hidratarCachePersistente();

      if (cacheEvaluaciones !== null) {
        setEvaluaciones(
          [...cacheEvaluaciones]
        );

        setCargado(true);
        setActualizando(true);
      } else {
        setCargado(false);
      }

      try {
        const cacheReciente =
          cacheEvaluaciones !== null &&
          Date.now() - ultimaCarga <
            CACHE_FRESCA_MS;

        if (!forzar && cacheReciente) {
          setEvaluaciones(
            [...(cacheEvaluaciones || [])]
          );

          return;
        }

        const nuevas =
          await cargarDesdeDrive();

        setEvaluaciones(nuevas);
      } catch (e) {
        console.error(
          'Error cargando evaluaciones desde Google Drive:',
          e
        );

        if (cacheEvaluaciones !== null) {
          setEvaluaciones(
            [...cacheEvaluaciones]
          );
        }

        setError(
          e instanceof Error
            ? e.message
            : 'Error desconocido al consultar Google Drive.'
        );
      } finally {
        setCargado(true);
        setActualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    hidratarCachePersistente();

    if (cacheEvaluaciones !== null) {
      setEvaluaciones(
        [...cacheEvaluaciones]
      );

      setCargado(true);
    }

    const suscriptor = (
      nuevas: EvaluacionGuardada[]
    ) => {
      setEvaluaciones(nuevas);
      setCargado(true);
    };

    suscriptores.add(suscriptor);

    void recargar(false);

    return () => {
      suscriptores.delete(suscriptor);
    };
  }, [recargar]);

  const eliminar = useCallback(
    async (
      id: string
    ): Promise<RespuestaEliminar> => {
      const evaluacionId = id.trim();

      if (!evaluacionId) {
        throw new Error(
          'No se recibió el id de la evaluación.'
        );
      }

      const copiaAnterior =
        cacheEvaluaciones
          ? [...cacheEvaluaciones]
          : null;

      try {
        const response = await fetch(
          '/api/drive/eliminar',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id: evaluacionId,
            }),
          }
        );

        const data: RespuestaEliminar =
          await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ||
              'No se pudo eliminar la evaluación de Google Drive.'
          );
        }

        if (cacheEvaluaciones) {
          establecerCache(
            cacheEvaluaciones.filter(
              (evaluacion) =>
                evaluacion.id !==
                evaluacionId
            )
          );
        }

        // El backend ya confirmó la eliminación.
        // No obligamos al usuario a esperar otra lista completa.
        invalidarCacheEvaluaciones();

        return data;
      } catch (e) {
        if (copiaAnterior) {
          establecerCache(
            copiaAnterior,
            ultimaCarga
          );
        }

        console.error(
          'Error eliminando evaluación de Google Drive:',
          e
        );

        throw e;
      }
    },
    []
  );

  return {
    evaluaciones,
    cargado,
    actualizando,
    error,

    recargar: () =>
      recargar(true),

    eliminar,
  };
}