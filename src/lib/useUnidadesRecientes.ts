'use client';

import { useMemo } from 'react';
import { useEvaluaciones } from '@/lib/useEvaluaciones';

export interface UnidadReciente {
  nombre: string;
  ultimoUso: string;
  cantidadRegistros: number;
  diasDesdeUltimoUso: number;
}

function fechaLocal(
  fecha: string
): Date | null {
  if (!fecha) return null;

  const partes =
    fecha.split('-').map(Number);

  if (partes.length !== 3) {
    return null;
  }

  const [anio, mes, dia] =
    partes;

  if (!anio || !mes || !dia) {
    return null;
  }

  const resultado =
    new Date(
      anio,
      mes - 1,
      dia
    );

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return null;
  }

  return resultado;
}

function normalizarUnidad(
  unidad: string
): string {
  return unidad
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-PE');
}

function diferenciaDias(
  fechaReferencia: Date,
  fechaRegistro: Date
): number {
  const referencia =
    new Date(
      fechaReferencia.getFullYear(),
      fechaReferencia.getMonth(),
      fechaReferencia.getDate()
    );

  const registro =
    new Date(
      fechaRegistro.getFullYear(),
      fechaRegistro.getMonth(),
      fechaRegistro.getDate()
    );

  return Math.floor(
    (
      referencia.getTime() -
      registro.getTime()
    ) /
      86_400_000
  );
}

/**
 * Reutiliza useEvaluaciones().
 *
 * Antes este hook hacía su propio fetch a /api/drive/listar,
 * provocando una consulta extra completa a Apps Script al entrar
 * a Editar Plantilla. Ahora comparte exactamente la misma caché
 * usada por Drive, Alumnos y Reportes.
 */
export function useUnidadesRecientes(
  fechaReferencia: string
) {
  const {
    evaluaciones,
    cargado,
    error,
  } = useEvaluaciones();

  const unidades = useMemo(() => {
    const referencia =
      fechaLocal(fechaReferencia) ??
      new Date();

    const agrupadas =
      new Map<
        string,
        UnidadReciente
      >();

    evaluaciones.forEach(
      (evaluacion) => {
        const nombre =
          evaluacion.unidad?.trim();

        const fecha =
          fechaLocal(
            evaluacion.fecha
          );

        if (!nombre || !fecha) {
          return;
        }

        const dias =
          diferenciaDias(
            referencia,
            fecha
          );

        // No sugerimos unidades que pertenecen
        // a fechas posteriores a la ficha actual.
        if (dias < 0) {
          return;
        }

        const clave =
          normalizarUnidad(nombre);

        const existente =
          agrupadas.get(clave);

        if (!existente) {
          agrupadas.set(clave, {
            nombre,
            ultimoUso:
              evaluacion.fecha,
            cantidadRegistros: 1,
            diasDesdeUltimoUso:
              dias,
          });

          return;
        }

        existente.cantidadRegistros += 1;

        if (
          dias <
          existente.diasDesdeUltimoUso
        ) {
          existente.nombre =
            nombre;

          existente.ultimoUso =
            evaluacion.fecha;

          existente.diasDesdeUltimoUso =
            dias;
        }
      }
    );

    return Array.from(
      agrupadas.values()
    ).sort(
      (a, b) =>
        a.diasDesdeUltimoUso -
        b.diasDesdeUltimoUso
    );
  }, [
    evaluaciones,
    fechaReferencia,
  ]);

  const recientes =
    useMemo(
      () =>
        unidades.filter(
          (unidad) =>
            unidad.diasDesdeUltimoUso <=
            15
        ),
      [unidades]
    );

  const anteriores =
    useMemo(
      () =>
        unidades.filter(
          (unidad) =>
            unidad.diasDesdeUltimoUso >
            15
        ),
      [unidades]
    );

  return {
    unidades,
    recientes,
    anteriores,

    cargando:
      !cargado,

    error,
  };
}